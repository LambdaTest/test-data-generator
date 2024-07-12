#!/usr/bin/env node
// Minimal ambient for the Node globals this CLI uses, so the library can be
// built without pulling @types/node into the (browser-safe) core.
declare const process: {
  argv: string[];
  stdout: { write(s: string): void };
  stderr: { write(s: string): void };
  exit(code: number): void;
};

import { toCSV, toJSON, toSQL } from './export.js';
import { TestDataGenerator } from './generator.js';
import { localeNames } from './locales/index.js';
import type { Schema } from './schema.js';

const BUILTIN_SCHEMAS: Record<string, (g: TestDataGenerator) => Schema> = {
  users: () => ({
    id: (g) => g.id.uuid(),
    firstName: (g) => g.person.firstName(),
    lastName: (g) => g.person.lastName(),
    email: (g, ctx) =>
      g.internet.email({
        firstName: ctx.record.firstName as string,
        lastName: ctx.record.lastName as string,
      }),
    age: (g) => g.number.int({ min: 18, max: 80 }),
    city: (g) => g.location.city(),
    country: (g) => g.location.countryCode(),
    createdAt: (g) => g.date.past({ years: 2 }),
  }),
  products: () => ({
    id: (g) => g.id.nanoid(10),
    name: (g) => g.helpers.fake('{{lorem.words}}'),
    sku: (g) => g.string.fromRegex(/^SKU-[A-Z]{3}-\d{5}$/),
    price: (g) => g.finance.amount({ min: 5, max: 500 }),
    inStock: (g) => g.helpers.boolean(0.8),
  }),
  transactions: () => ({
    id: (g) => g.id.uuid(),
    amount: (g) => g.finance.amount({ min: 1, max: 5000 }),
    currency: (g) => g.finance.currencyCode(),
    card: (g) => g.finance.creditCardNumber(),
    status: (g) =>
      g.helpers.weighted([
        { weight: 8, value: 'completed' },
        { weight: 1, value: 'pending' },
        { weight: 1, value: 'failed' },
      ]),
    timestamp: (g) => g.date.recent({ days: 30 }),
  }),
};

/** Fixed reference date so a seed alone makes date fields reproducible. */
const DEFAULT_REF_DATE = '2025-01-01T00:00:00.000Z';

interface ParsedArgs {
  command?: string;
  count: number;
  seed?: string;
  locale?: string;
  format: string;
  table?: string;
  refDate?: string;
  help: boolean;
  version: boolean;
}

function parseArgs(argv: string[]): ParsedArgs {
  const parsed: ParsedArgs = { count: 10, format: 'json', help: false, version: false };
  const rest = [...argv];
  while (rest.length > 0) {
    const arg = rest.shift() as string;
    switch (arg) {
      case '-h':
      case '--help':
        parsed.help = true;
        break;
      case '-v':
      case '--version':
        parsed.version = true;
        break;
      case '-c':
      case '--count':
        parsed.count = Number(rest.shift());
        break;
      case '-s':
      case '--seed':
        parsed.seed = rest.shift();
        break;
      case '-l':
      case '--locale':
        parsed.locale = rest.shift();
        break;
      case '-f':
      case '--format':
        parsed.format = String(rest.shift());
        break;
      case '-t':
      case '--table':
        parsed.table = rest.shift();
        break;
      case '--ref-date':
        parsed.refDate = rest.shift();
        break;
      default:
        if (arg.startsWith('-')) {
          throw new Error(`Unknown option '${arg}'. Run 'tdg --help'.`);
        }

        parsed.command ??= arg;
    }
  }

  return parsed;
}

const HELP = `tdg — deterministic test data generator

Usage:
  tdg <schema> [options]

Schemas:
  ${Object.keys(BUILTIN_SCHEMAS).join(', ')}

Options:
  -c, --count <n>       number of records (default 10)
  -s, --seed <seed>     seed for reproducible output (number or string)
  -l, --locale <code>   locale: ${localeNames.join(', ')} (default en)
  -f, --format <fmt>    output: json | csv | sql (default json)
  -t, --table <name>    table name for --format sql (default = schema name)
      --ref-date <iso>  reference date for date fields (default fixed epoch when seeded)
  -h, --help            show this help
  -v, --version         show version

Examples:
  tdg users --count 100 --seed 42
  tdg users -c 50 -l de -f csv
  tdg transactions -c 20 -f sql -t payments
`;

export function runCli(argv: string[]): { output: string; exitCode: number } {
  let args: ParsedArgs;
  try {
    args = parseArgs(argv);
  } catch (error) {
    return { output: (error as Error).message, exitCode: 1 };
  }

  if (args.help) return { output: HELP, exitCode: 0 };
  if (args.version) return { output: '0.2.0', exitCode: 0 };

  if (!args.command) {
    return { output: `Missing schema.\n\n${HELP}`, exitCode: 1 };
  }

  const schemaFactory = BUILTIN_SCHEMAS[args.command];
  if (!schemaFactory) {
    return {
      output: `Unknown schema '${args.command}'. Available: ${Object.keys(BUILTIN_SCHEMAS).join(', ')}.`,
      exitCode: 1,
    };
  }

  if (!Number.isInteger(args.count) || args.count < 1) {
    return { output: `--count must be a positive integer.`, exitCode: 1 };
  }

  try {
    const refDate =
      args.refDate ?? (args.seed !== undefined ? DEFAULT_REF_DATE : undefined);
    const g = new TestDataGenerator({ seed: args.seed, locale: args.locale, refDate });
    const rows = g.fromSchema(schemaFactory(g), args.count) as Array<Record<string, unknown>>;

    let output: string;
    switch (args.format) {
      case 'json':
        output = toJSON(rows);
        break;
      case 'csv':
        output = toCSV(rows);
        break;
      case 'sql':
        output = toSQL(args.table ?? args.command, rows);
        break;
      default:
        return { output: `Unknown format '${args.format}'. Use json, csv, or sql.`, exitCode: 1 };
    }

    return { output, exitCode: 0 };
  } catch (error) {
    return { output: `Error: ${(error as Error).message}`, exitCode: 1 };
  }
}

// Executed directly (not imported) → run and print.
const isMain =
  typeof process !== 'undefined' &&
  Array.isArray(process.argv) &&
  /cli\.(c?js|ts)$/.test(process.argv[1] ?? '');

if (isMain) {
  const { output, exitCode } = runCli(process.argv.slice(2));
  if (exitCode === 0) {
    process.stdout.write(output + '\n');
  } else {
    process.stderr.write(output + '\n');
  }

  process.exit(exitCode);
}
