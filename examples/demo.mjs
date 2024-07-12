/**
 * Demo: run with `node examples/demo.mjs`
 * Shows seeded generation, schema records, boundary cases, and seed replay.
 */
import { TestDataGenerator } from '../dist/index.js';

const g = new TestDataGenerator({ seed: 'demo-2026', refDate: '2026-07-12T00:00:00Z' });

console.log('=== 1. Basic values (seed: "demo-2026") ===');
console.log('Name:      ', g.person.fullName());
console.log('Email:     ', g.internet.email());
console.log('Job:       ', g.person.jobTitle());
console.log('UUID:      ', g.id.uuid());
console.log('Card:      ', g.finance.creditCardNumber({ issuer: 'visa' }));
console.log('Phone:     ', g.phone.number('+91 ##### #####'));
console.log('Address:   ', `${g.location.streetAddress()}, ${g.location.city()} ${g.location.zipCode()}, ${g.location.country()}`);
console.log('Birthdate: ', g.date.birthdate({ minAge: 21, maxAge: 45 }).toISOString().slice(0, 10));

console.log('\n=== 2. Schema: 5 user records ===');
const users = g.fromSchema(
  {
    row: (_g, ctx) => ctx.index + 1,
    id: (g) => g.id.nanoid(8),
    name: (g) => g.person.fullName(),
    email: (g) => g.internet.email(),
    age: (g) => g.number.int({ min: 18, max: 65 }),
    plan: (g) => g.helpers.weighted([
      { weight: 6, value: 'free' },
      { weight: 3, value: 'pro' },
      { weight: 1, value: 'enterprise' },
    ]),
    signupDate: (g) => g.date.past({ years: 2 }).toISOString().slice(0, 10),
    address: {
      city: (g) => g.location.city(),
      country: (g) => g.location.countryCode(),
    },
  },
  5
);
console.table(users.map((u) => ({ ...u, address: `${u.address.city}, ${u.address.country}` })));

console.log('=== 3. Boundary cases: quantity field (1–100) ===');
console.table(g.boundary.integers({ min: 1, max: 100 }));

console.log('=== 4. Boundary cases: emails (negative testing) ===');
console.table(g.boundary.emails().map(({ label, value, valid }) => ({ label, value: value || '(empty)', valid })));

console.log('=== 5. Regex-constrained strings ===');
console.log('Order ref:   ', g.string.fromRegex(/^ORD-[A-Z]{2}-\d{6}$/));
console.log('Plate:       ', g.string.fromRegex(/^IN-[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/));
console.log('Semver:      ', g.string.fromRegex(/^v\d+\.\d+\.\d+(-rc\.\d)?$/));
console.log('Hex token:   ', g.string.fromRegex(/^[a-f0-9]{16}$/));

console.log('\n=== 6. Uniqueness guarantee ===');
const uniqueEmail = g.helpers.uniqueFactory(() => g.internet.email());
const batch = Array.from({ length: 500 }, () => uniqueEmail());
console.log(`Generated ${batch.length} emails, distinct: ${new Set(batch).size} (guaranteed)`);

console.log('\n=== 7. Relational dataset (valid foreign keys) ===');
const db = g.dataset({
  users: {
    count: 3,
    schema: {
      id: (g) => g.id.nanoid(6),
      firstName: (g) => g.person.firstName(),
      // email derived from firstName → internally consistent record
      email: (g, ctx) => g.internet.email({ firstName: ctx.record.firstName, provider: 'shop.test' }),
    },
  },
  orders: {
    each: { of: 'users', count: { min: 1, max: 2 } }, // 1–2 orders PER user
    schema: {
      id: (g) => g.id.nanoid(6),
      userId: (_g, ctx) => ctx.parent.id, // guaranteed-valid FK
      total: (g) => g.finance.amount({ min: 20, max: 900 }),
    },
  },
});
console.table(db.users);
console.table(db.orders);
const userIds = new Set(db.users.map((u) => u.id));
console.log('All order FKs valid:', db.orders.every((o) => userIds.has(o.userId)));

console.log('\n=== 8. Seed replay ===');
const replay = new TestDataGenerator({ seed: 'demo-2026', refDate: '2026-07-12T00:00:00Z' });
console.log('Fresh instance, same seed →', replay.person.fullName(), '/', replay.internet.email());
console.log('(identical to section 1 — every run of this script prints the same data)');
