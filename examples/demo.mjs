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

console.log('=== 5. Seed replay ===');
const replay = new TestDataGenerator({ seed: 'demo-2026', refDate: '2026-07-12T00:00:00Z' });
console.log('Fresh instance, same seed →', replay.person.fullName(), '/', replay.internet.email());
console.log('(identical to section 1 — every run of this script prints the same data)');
