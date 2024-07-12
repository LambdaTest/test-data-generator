import { TDGError } from './errors.js';

export type Row = Record<string, unknown>;

export interface CsvOptions {
  /** Field delimiter. Default `,`. */
  delimiter?: string;
  /** Emit a header row from the keys. Default `true`. */
  header?: boolean;
  /** Explicit column order. Default: keys of the first row. */
  columns?: string[];
  /** Line terminator. Default `\n`. */
  eol?: string;
}

export interface SqlOptions {
  /** Explicit column order. Default: keys of the first row. */
  columns?: string[];
  /** One multi-row INSERT instead of one per row. Default `false`. */
  multiRow?: boolean;
  /** Identifier quote character for table/columns. Default `"` (standard SQL). Use `` ` `` for MySQL. */
  quote?: string;
}

function columnsOf(rows: Row[], explicit?: string[]): string[] {
  if (explicit) return explicit;
  // Union of every row's keys, in first-seen order — so columns present only
  // in later rows are not silently dropped.
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) seen.add(key);
  }

  return [...seen];
}

function toCsvField(value: unknown, delimiter: string): string {
  const str =
    value == null
      ? ''
      : value instanceof Date
        ? value.toISOString()
        : typeof value === 'object'
          ? JSON.stringify(value)
          : String(value);

  // Quote if the field contains the delimiter, quotes, or newlines.
  if (str.includes(delimiter) || str.includes('"') || /[\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/** Serializes rows to JSON. `pretty` (default true) indents with 2 spaces. */
export function toJSON(rows: Row[] | Row, pretty = true): string {
  return JSON.stringify(rows, jsonReplacer, pretty ? 2 : undefined);
}

function jsonReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  // JSON has no BigInt; emit as a number when safe, else a string, so
  // toJSON never throws on bigint values (which schemas allow).
  if (typeof value === 'bigint') {
    return value >= BigInt(Number.MIN_SAFE_INTEGER) && value <= BigInt(Number.MAX_SAFE_INTEGER)
      ? Number(value)
      : value.toString();
  }

  return value;
}

/** Serializes rows to CSV (RFC-4180 quoting). */
export function toCSV(rows: Row[], options: CsvOptions = {}): string {
  const { delimiter = ',', header = true, eol = '\n' } = options;
  const columns = columnsOf(rows, options.columns);
  const lines: string[] = [];

  if (header) {
    lines.push(columns.map((c) => toCsvField(c, delimiter)).join(delimiter));
  }

  for (const row of rows) {
    lines.push(
      columns.map((c) => toCsvField(row[c], delimiter)).join(delimiter)
    );
  }

  return lines.join(eol);
}

function toSqlLiteral(value: unknown): string {
  if (value == null) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (typeof value === 'bigint') return value.toString(); // unquoted numeric
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
  return `'${str.replace(/'/g, "''")}'`; // escape single quotes
}

/** Serializes rows to SQL `INSERT` statements for the given table. */
export function toSQL(table: string, rows: Row[], options: SqlOptions = {}): string {
  if (!/^[A-Za-z_][A-Za-z0-9_.]*$/.test(table)) {
    throw new TDGError(`toSQL: invalid table name '${table}'.`);
  }

  if (rows.length === 0) return '';

  const { multiRow = false, quote = '"' } = options;
  const columns = columnsOf(rows, options.columns);
  const q = (id: string) => `${quote}${id.replace(new RegExp(quote, 'g'), quote + quote)}${quote}`;
  const colList = columns.map(q).join(', ');
  const valuesFor = (row: Row) =>
    `(${columns.map((c) => toSqlLiteral(row[c])).join(', ')})`;

  if (multiRow) {
    const values = rows.map(valuesFor).join(',\n  ');
    return `INSERT INTO ${q(table)} (${colList}) VALUES\n  ${values};`;
  }

  return rows
    .map((row) => `INSERT INTO ${q(table)} (${colList}) VALUES ${valuesFor(row)};`)
    .join('\n');
}
