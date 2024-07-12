import { describe, expect, it } from 'vitest';
import { TestDataGenerator } from '../src/index.js';

const g = new TestDataGenerator({ seed: 42, refDate: '2026-01-01T00:00:00Z' });

describe('fromSchema', () => {
  const userSchema = {
    id: (gen: TestDataGenerator) => gen.id.uuid(),
    name: (gen: TestDataGenerator) => gen.person.fullName(),
    age: (gen: TestDataGenerator) => gen.number.int({ min: 18, max: 80 }),
    role: 'tester',
    address: {
      city: (gen: TestDataGenerator) => gen.location.city(),
      zip: (gen: TestDataGenerator) => gen.location.zipCode(),
    },
  };

  it('resolves functions, literals and nested schemas', () => {
    const user = g.fromSchema(userSchema);
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.name).toMatch(/ /);
    expect(user.age).toBeGreaterThanOrEqual(18);
    expect(user.age).toBeLessThanOrEqual(80);
    expect(user.role).toBe('tester');
    expect(user.address.zip).toMatch(/^\d{5}$/);
  });

  it('generates arrays of records with per-record context', () => {
    const rows = g.fromSchema(
      {
        rowNumber: (_gen: TestDataGenerator, ctx: { index: number }) => ctx.index + 1,
        email: (gen: TestDataGenerator) => gen.internet.email(),
      },
      5
    );

    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.rowNumber)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(rows.map((r) => r.email)).size).toBeGreaterThan(1);
  });

  it('is deterministic under a fixed seed', () => {
    const make = () => {
      const gen = new TestDataGenerator({ seed: 99 });
      return gen.fromSchema(
        { name: (x: TestDataGenerator) => x.person.fullName() },
        3
      );
    };

    expect(make()).toEqual(make());
  });

  it('copies literal arrays and dates as-is', () => {
    const pinned = new Date('2020-06-01');
    const record = g.fromSchema({ tags: ['a', 'b'], created: pinned });
    expect(record.tags).toEqual(['a', 'b']);
    expect(record.created).toBe(pinned);
  });
});
