import { describe, expect, it } from 'vitest';
import { TDGError, TestDataGenerator } from '../src/index.js';

describe('schema field references (ctx.record)', () => {
  it('later fields can read earlier fields', () => {
    const g = new TestDataGenerator({ seed: 42 });
    const users = g.fromSchema(
      {
        firstName: (g) => g.person.firstName(),
        lastName: (g) => g.person.lastName(),
        email: (g, ctx) =>
          g.internet.email({
            firstName: ctx.record.firstName as string,
            lastName: ctx.record.lastName as string,
            provider: 'example.com',
          }),
      },
      20
    );

    for (const user of users) {
      const slug = user.firstName.toLowerCase();
      expect(user.email.startsWith(slug)).toBe(true);
      expect(user.email.endsWith('@example.com')).toBe(true);
    }
  });

  it('nested schemas can also read root fields', () => {
    const g = new TestDataGenerator({ seed: 42 });
    const record = g.fromSchema({
      name: (g) => g.person.firstName(),
      profile: {
        greeting: (_g, ctx) => `Hello, ${ctx.record.name}!`,
      },
    });

    expect(record.profile.greeting).toBe(`Hello, ${record.name}!`);
  });
});

describe('dataset', () => {
  const makeDb = (seed: number | string) => {
    const g = new TestDataGenerator({ seed });
    return g.dataset({
      users: {
        count: 5,
        schema: {
          id: (g) => g.id.uuid(),
          name: (g) => g.person.fullName(),
        },
      },
      orders: {
        each: { of: 'users', count: { min: 1, max: 3 } },
        schema: {
          id: (g) => g.id.nanoid(10),
          userId: (_g, ctx) => ctx.parent.id as string,
          amount: (g) => g.finance.amount({ min: 10, max: 500 }),
        },
      },
      auditLogs: {
        count: 4,
        schema: {
          actorId: (g, ctx) =>
            g.helpers.arrayElement(ctx.entities.users as Array<{ id: string }>).id,
          action: (g) => g.helpers.arrayElement(['login', 'purchase', 'logout']),
        },
      },
    });
  };

  it('every foreign key references a real parent', () => {
    const db = makeDb(42);
    const userIds = new Set(db.users.map((u) => u.id));

    expect(db.users).toHaveLength(5);
    expect(db.orders.length).toBeGreaterThanOrEqual(5); // at least 1 per user
    expect(db.orders.length).toBeLessThanOrEqual(15); // at most 3 per user

    for (const order of db.orders) {
      expect(userIds.has(order.userId)).toBe(true);
    }

    for (const log of db.auditLogs) {
      expect(userIds.has(log.actorId)).toBe(true);
    }
  });

  it('each parent gets at least the minimum number of children', () => {
    const db = makeDb(7);
    for (const user of db.users) {
      const orders = db.orders.filter((o) => o.userId === user.id);
      expect(orders.length).toBeGreaterThanOrEqual(1);
      expect(orders.length).toBeLessThanOrEqual(3);
    }
  });

  it('is deterministic under a fixed seed', () => {
    expect(makeDb('db-seed')).toEqual(makeDb('db-seed'));
  });

  it('rejects references to undeclared collections', () => {
    const g = new TestDataGenerator({ seed: 42 });
    expect(() =>
      g.dataset({
        orders: {
          each: { of: 'users', count: 1 },
          schema: { id: (g) => g.id.uuid() },
        },
      })
    ).toThrow(TDGError);
    expect(() =>
      g.dataset({
        orders: {
          each: { of: 'users', count: 1 },
          schema: { id: (g) => g.id.uuid() },
        },
      })
    ).toThrow(/not declared before/);
  });
});
