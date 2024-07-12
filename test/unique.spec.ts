import { describe, expect, it } from 'vitest';
import { TDGError, TestDataGenerator } from '../src/index.js';

describe('helpers.uniqueFactory', () => {
  it('never returns the same value twice', () => {
    const g = new TestDataGenerator({ seed: 42 });
    const email = g.helpers.uniqueFactory(() => g.internet.email());

    const values = Array.from({ length: 200 }, () => email());
    expect(new Set(values).size).toBe(200);
    expect(email.seenCount()).toBe(200);
  });

  it('throws a helpful error when the value space is exhausted', () => {
    const g = new TestDataGenerator({ seed: 42 });
    const digit = g.helpers.uniqueFactory(
      () => g.number.int({ min: 1, max: 3 }),
      { maxRetries: 30 }
    );

    expect(new Set([digit(), digit(), digit()]).size).toBe(3);
    expect(() => digit()).toThrow(TDGError);
    expect(() => digit()).toThrow(/values already used/);
  });

  it('clear() resets the seen-set', () => {
    const g = new TestDataGenerator({ seed: 42 });
    const bit = g.helpers.uniqueFactory(() => g.number.int({ min: 0, max: 1 }));
    bit();
    bit();
    expect(() => bit()).toThrow(TDGError);
    bit.clear();
    expect(bit.seenCount()).toBe(0);
    expect(() => bit()).not.toThrow();
  });

  it('works inside fromSchema for batch generation', () => {
    const g = new TestDataGenerator({ seed: 7 });
    const email = g.helpers.uniqueFactory(() => g.internet.email());
    const users = g.fromSchema({ email: () => email() }, 100);
    expect(new Set(users.map((u) => u.email)).size).toBe(100);
  });
});

describe('helpers.unique (scoped)', () => {
  it('scopes are independent', () => {
    const g = new TestDataGenerator({ seed: 42 });
    const a1 = g.helpers.unique(() => g.number.int({ min: 1, max: 2 }), { scope: 'a' });
    const a2 = g.helpers.unique(() => g.number.int({ min: 1, max: 2 }), { scope: 'a' });
    expect(new Set([a1, a2]).size).toBe(2);
    expect(() =>
      g.helpers.unique(() => g.number.int({ min: 1, max: 2 }), { scope: 'a' })
    ).toThrow(TDGError);

    // Same exhausted values are fine in a different scope.
    expect(() =>
      g.helpers.unique(() => g.number.int({ min: 1, max: 2 }), { scope: 'b' })
    ).not.toThrow();
  });

  it('clearUnique() resets scopes', () => {
    const g = new TestDataGenerator({ seed: 42 });
    g.helpers.unique(() => 1, { scope: 'x' });
    expect(() => g.helpers.unique(() => 1, { scope: 'x', maxRetries: 5 })).toThrow();
    g.helpers.clearUnique('x');
    expect(g.helpers.unique(() => 1, { scope: 'x' })).toBe(1);
  });
});
