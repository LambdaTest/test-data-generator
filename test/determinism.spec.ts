import { describe, expect, it } from 'vitest';
import { Mulberry32, TestDataGenerator } from '../src/index.js';

describe('determinism', () => {
  it('produces identical sequences for the same numeric seed', () => {
    const a = new TestDataGenerator({ seed: 42 });
    const b = new TestDataGenerator({ seed: 42 });

    for (let i = 0; i < 50; i++) {
      expect(a.number.int(1_000_000)).toBe(b.number.int(1_000_000));
    }
  });

  it('produces identical values across all modules for the same seed', () => {
    const make = () => {
      const g = new TestDataGenerator({ seed: 1337, refDate: '2026-01-01T00:00:00Z' });
      return {
        name: g.person.fullName(),
        email: g.internet.email(),
        uuid: g.id.uuid(),
        city: g.location.city(),
        card: g.finance.creditCardNumber(),
        date: g.date.past().toISOString(),
        words: g.lorem.words(5),
        phone: g.phone.number(),
      };
    };

    expect(make()).toEqual(make());
  });

  it('supports string seeds', () => {
    const a = new TestDataGenerator({ seed: 'checkout-flow' });
    const b = new TestDataGenerator({ seed: 'checkout-flow' });
    const c = new TestDataGenerator({ seed: 'login-flow' });

    const [va, vb, vc] = [a, b, c].map((g) => g.string.alphanumeric(20));
    expect(va).toBe(vb);
    expect(va).not.toBe(vc);
  });

  it('reseeding resets the stream', () => {
    const g = new TestDataGenerator({ seed: 7 });
    const first = [g.number.int(100), g.number.int(100), g.number.int(100)];
    g.seed(7);
    const second = [g.number.int(100), g.number.int(100), g.number.int(100)];
    expect(first).toEqual(second);
  });

  it('seed() without argument returns a replayable seed', () => {
    const g = new TestDataGenerator();
    const seed = g.seed();
    const first = g.id.uuid();
    g.seed(seed);
    expect(g.id.uuid()).toBe(first);
  });

  it('different seeds produce different output', () => {
    const a = new TestDataGenerator({ seed: 1 });
    const b = new TestDataGenerator({ seed: 2 });
    const seqA = Array.from({ length: 10 }, () => a.number.int(1_000_000));
    const seqB = Array.from({ length: 10 }, () => b.number.int(1_000_000));
    expect(seqA).not.toEqual(seqB);
  });

  it('accepts a custom randomizer', () => {
    let calls = 0;
    const g = new TestDataGenerator({
      randomizer: {
        next: () => {
          calls++;
          return 0.5;
        },
        seed: () => undefined,
      },
    });

    expect(g.number.int({ min: 0, max: 10 })).toBe(5);
    expect(calls).toBe(1);
  });

  it('Mulberry32 emits floats in [0, 1)', () => {
    const rng = new Mulberry32(123);
    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
