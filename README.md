# @lambdatest/test-data-generator

> Deterministic, seedable test data for QA and development — with boundary-value cases and schema-based record generation built in. Zero dependencies.

[![CI](https://github.com/lambdatest/test-data-generator/actions/workflows/ci.yml/badge.svg)](https://github.com/lambdatest/test-data-generator/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@lambdatest/test-data-generator)](https://www.npmjs.com/package/@lambdatest/test-data-generator)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

## Why another data generator?

Most fake-data libraries optimize for *realistic-looking* data. This one optimizes for **testing**:

- **Deterministic by design** — seed with a number *or a string* (`seed: 'checkout-flow'`), pin the reference date, and every run of your suite generates the exact same data. Failures replay perfectly.
- **Boundary-value & negative cases** — `tdg.boundary.*` produces the values QA actually needs: at, just inside, and just outside every edge, each labeled and flagged `valid: true/false` so they drop straight into `test.each`.
- **Schema-based records** — describe a record once, generate one or a thousand.
- **Zero runtime dependencies**, dual ESM + CJS, full TypeScript types.

## Install

```bash
npm install --save-dev @lambdatest/test-data-generator
```

## Quick start

```ts
import { TestDataGenerator } from '@lambdatest/test-data-generator';

const g = new TestDataGenerator({ seed: 42 });

g.person.fullName();          // 'Maya Fischer'   — same on every run
g.internet.email();           // 'maya_fischer7@proton.me'
g.id.uuid();                  // seed-deterministic v4 UUID
g.finance.creditCardNumber(); // Luhn-valid card number
g.date.past();                // a date in the last year
```

Or use the shared instance:

```ts
import { tdg } from '@lambdatest/test-data-generator';

const seed = tdg.seed();   // random, but returned — log it on failure
// ... test runs ...
tdg.seed(seed);            // replay the exact same data
```

## Schema-based records

```ts
const users = g.fromSchema(
  {
    id: (g) => g.id.uuid(),
    name: (g) => g.person.fullName(),
    email: (g) => g.internet.email(),
    age: (g) => g.number.int({ min: 18, max: 80 }),
    role: 'tester', // literals are copied as-is
    address: {      // schemas nest
      city: (g) => g.location.city(),
      zip: (g) => g.location.zipCode(),
    },
    rowNumber: (_g, ctx) => ctx.index + 1, // per-record context
  },
  100 // omit for a single record
);
```

## Boundary-value testing

Every case carries `{ value, label, valid }` — built for parametrized tests:

```ts
// Field constraint: quantity must be 1–100
const cases = g.boundary.integers({ min: 1, max: 100 });
// [
//   { value: 0,   label: 'below minimum',      valid: false },
//   { value: 1,   label: 'at minimum',         valid: true  },
//   { value: 2,   label: 'just above minimum', valid: true  },
//   { value: 50,  label: 'middle of range',    valid: true  },
//   { value: 99,  label: 'just below maximum', valid: true  },
//   { value: 100, label: 'at maximum',         valid: true  },
//   { value: 101, label: 'above maximum',      valid: false },
// ]

test.each(cases)('quantity $label ($value)', ({ value, valid }) => {
  expect(validateQuantity(value)).toBe(valid);
});
```

Also available: `boundary.strings({ minLength, maxLength })` (length edges, whitespace-only, unicode) and `boundary.emails()` (valid + classic invalid formats).

## Uniqueness guarantees

Inserting generated data into anything with a unique constraint? Wrap the generator:

```ts
const email = g.helpers.uniqueFactory(() => g.internet.email());
const users = g.fromSchema({ email: () => email() }, 1000); // 1000 distinct emails
```

Throws a clear `TDGError` if the value space is exhausted (configurable `maxRetries`, plus `clear()` to reset). A scoped one-off variant also exists: `g.helpers.unique(fn, { scope: 'emails' })`.

## Regex-constrained strings

Generate values that match the formats your system actually validates:

```ts
g.string.fromRegex(/^[A-Z]{2}-\d{4}$/);              // 'QT-8317'
g.string.fromRegex(/^(GST|PAN)-[A-Z0-9]{10}$/);      // 'PAN-4XKP2M9QF1'
g.string.fromRegex(/^v\d+\.\d+\.\d+(-rc\.\d)?$/);    // 'v2.14.0-rc.3'
```

Supports literals, `.`, escapes (`\d \w \s` + negations), character classes, groups, alternation, and all quantifiers (unbounded ones capped via `{ maxRepetition }`). Every generated value is self-checked against the real regex engine. Lookarounds, backreferences and `\b` throw a clear error.

## Relational datasets

Seed whole databases with guaranteed-valid foreign keys and internally consistent records:

```ts
const db = g.dataset({
  users: {
    count: 10,
    schema: {
      id: (g) => g.id.uuid(),
      firstName: (g) => g.person.firstName(),
      // later fields can reference earlier ones — consistent records
      email: (g, ctx) => g.internet.email({ firstName: ctx.record.firstName }),
    },
  },
  orders: {
    each: { of: 'users', count: { min: 1, max: 3 } }, // 1–3 orders PER user
    schema: {
      id: (g) => g.id.nanoid(10),
      userId: (_g, ctx) => ctx.parent.id, // guaranteed-valid FK
      amount: (g) => g.finance.amount({ min: 10, max: 500 }),
    },
  },
  auditLogs: {
    count: 50,
    schema: {
      // or associate randomly with any previously generated collection
      actorId: (g, ctx) => g.helpers.arrayElement(ctx.entities.users).id,
    },
  },
});
// db.users: 10, db.orders: 10–30 (every userId exists), db.auditLogs: 50
```

## Reproducible dates

Seeding fixes the random stream; relative dates also need a fixed "now":

```ts
const g = new TestDataGenerator({
  seed: 42,
  refDate: '2026-01-01T00:00:00Z', // date.past()/future()/birthdate() resolve against this
});
```

## Modules

| Module | Highlights |
| --- | --- |
| `number` | `int({min,max})`, `float({fractionDigits})`, `hex()` |
| `string` | `alpha()`, `alphanumeric()`, `numeric()`, `fromCharacters()`, `fromRegex()`, length ranges |
| `id` | `uuid()` (v4, seed-deterministic), `nanoid()`, `hex()` |
| `person` | `firstName()`, `lastName()`, `fullName()`, `jobTitle()` |
| `internet` | `email()`, `username()`, `url()`, `ip()`, `ipv6()`, `mac()`, `password()`, `httpStatusCode()` |
| `location` | `city()`, `country()`, `countryCode()`, `streetAddress()`, `zipCode()`, `coordinates()` |
| `date` | `past()`, `future()`, `between()`, `recent()`, `soon()`, `birthdate()` |
| `finance` | `amount()`, `currency*()`, Luhn-valid `creditCardNumber()`, `pin()`, `accountNumber()` |
| `phone` | `number('###-###-####')`, `international()` |
| `lorem` | `word()`, `sentence()`, `paragraph()`, `slug()` |
| `helpers` | `arrayElement()`, `weighted()`, `shuffle()`, `multiple()`, `maybe()`, `unique()`, `uniqueFactory()`, `replaceSymbols()`, `slugify()` |
| `boundary` | `integers()`, `strings()`, `emails()` — labeled valid/invalid test cases |

All module methods are pre-bound — destructure freely: `const { email } = g.internet`.

## Custom randomness

The PRNG is pluggable via the two-method `Randomizer` interface:

```ts
import { TestDataGenerator, type Randomizer } from '@lambdatest/test-data-generator';

const myRandomizer: Randomizer = {
  next: () => myPrng.nextFloat(), // [0, 1)
  seed: (s) => myPrng.reseed(s),
};

const g = new TestDataGenerator({ randomizer: myRandomizer, seed: 42 });
```

## Roadmap

- [x] Uniqueness guarantees (`unique()` / `uniqueFactory()`)
- [x] Regex-constrained generation (`string.fromRegex()`)
- [x] Relational datasets with valid foreign keys (`dataset()`)
- [ ] Boundary cases for dates and floats
- [ ] Security payloads (XSS/SQLi negative cases)
- [ ] Locale packs (names/addresses beyond English)
- [ ] `fake('{{person.fullName}}')`-style templates
- [ ] CSV / JSON / SQL export helpers
- [ ] CLI (`npx tdg users --count 100 --seed 42`)

## Contributing

```bash
git clone https://github.com/lambdatest/test-data-generator.git
cd test-data-generator
npm install
npm test        # vitest
npm run build   # tsup → dist/
```

PRs welcome. Please add tests for new generators — determinism tests especially.

## License

[MIT](./LICENSE) © LambdaTest
