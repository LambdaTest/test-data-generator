import { describe, expect, it } from 'vitest';
import { TDGError, TestDataGenerator, toCSV, toJSON, toSQL } from '../src/index.js';

const g = new TestDataGenerator({ seed: 42, refDate: '2025-06-15T00:00:00Z' });

describe('regression: date past/future/recent/soon with 0 duration', () => {
  it('does not throw and returns the ref date', () => {
    const ref = new Date('2025-06-15T00:00:00Z').getTime();
    expect(g.date.past({ years: 0 }).getTime()).toBe(ref);
    expect(g.date.future({ years: 0 }).getTime()).toBe(ref);
    expect(g.date.recent({ days: 0 }).getTime()).toBe(ref);
    expect(g.date.soon({ days: 0 }).getTime()).toBe(ref);
  });

  it('still produces in-range dates for positive durations', () => {
    const ref = new Date('2025-06-15T00:00:00Z').getTime();
    for (let i = 0; i < 100; i++) {
      expect(g.date.past({ years: 2 }).getTime()).toBeLessThanOrEqual(ref);
      expect(g.date.future({ years: 2 }).getTime()).toBeGreaterThanOrEqual(ref);
    }
  });
});

describe('regression: internet.email always valid', () => {
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it('never emits a dangling dot or empty local part, even for degenerate names', () => {
    const inputs: Array<[string, string]> = [
      ['', ''],
      ['   ', '!!!'],
      ['你好', '世界'],
      ['...', '---'],
      ['', 'Smith'],
      ['Liam', ''],
    ];
    for (const [firstName, lastName] of inputs) {
      const e = g.internet.email({ firstName, lastName, provider: 'x.com' });
      expect(e, JSON.stringify([firstName, lastName])).toMatch(EMAIL);
      expect(e).not.toMatch(/\.@/); // no dot right before @
      expect(e).not.toMatch(/@.*\.\./); // no double dots
    }
  });

  it('default emails are always valid at volume', () => {
    for (let i = 0; i < 5000; i++) expect(g.internet.email()).toMatch(EMAIL);
  });
});

describe('regression: number.float stays within [min, max]', () => {
  it('rounding never escapes the range', () => {
    for (let i = 0; i < 200_000; i++) {
      const v = g.number.float({ min: 0, max: 1, fractionDigits: 1 });
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    for (let i = 0; i < 50_000; i++) {
      const v = g.number.float({ min: 0.4, max: 1, fractionDigits: 0 });
      expect(v).toBeGreaterThanOrEqual(0.4);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('rejects out-of-bounds fractionDigits', () => {
    expect(() => g.number.float({ fractionDigits: 350 })).toThrow(TDGError);
    expect(() => g.number.float({ fractionDigits: -1 })).toThrow(TDGError);
  });
});

describe('regression: helpers.arrayElements clamps count', () => {
  it('negative count returns empty, oversized clamps to length', () => {
    const arr = [1, 2, 3, 4];
    expect(g.helpers.arrayElements(arr, -1)).toEqual([]);
    expect(g.helpers.arrayElements(arr, -100)).toEqual([]);
    expect(g.helpers.arrayElements(arr, 100)).toHaveLength(4);
    expect(g.helpers.arrayElements(arr, { min: -3, max: 0 })).toEqual([]);
  });
});

describe('regression: helpers.fake single-pass', () => {
  it('handles thousands of tokens without a spurious guard error', () => {
    const template = '{{number.int}} '.repeat(1500);
    const out = g.helpers.fake(template);
    expect(out).not.toContain('{{');
  });

  it('does not re-interpret braces that appear in generated output', () => {
    // string.sample can emit "{{...}}"-looking text; it must be left alone.
    for (let i = 0; i < 2000; i++) {
      expect(() => g.helpers.fake('{{string.sample}}')).not.toThrow();
    }
  });
});

describe('regression: string.fromCharacters validates length', () => {
  it('rejects negative and fractional lengths', () => {
    expect(() => g.string.numeric(-5)).toThrow(TDGError);
    expect(() => g.string.fromCharacters('abc', 2.5)).toThrow(TDGError);
  });
});

describe('regression: finance.amount respects max and validates digits', () => {
  it('never exceeds max', () => {
    for (let i = 0; i < 50_000; i++) {
      const a = Number(g.finance.amount({ min: 0, max: 1 }));
      expect(a).toBeLessThanOrEqual(1);
      expect(a).toBeGreaterThanOrEqual(0);
    }
  });

  it('throws a TDGError (not a raw RangeError) for bad fractionDigits', () => {
    expect(() => g.finance.amount({ fractionDigits: -1 })).toThrow(TDGError);
    expect(() => g.finance.amount({ fractionDigits: 101 })).toThrow(TDGError);
  });
});

describe('regression: boundary dedupe and validity', () => {
  it('integers produce no duplicate values on tiny ranges', () => {
    for (const [min, max] of [[1, 2], [5, 6], [1, 3], [0, 0], [-1, 1]] as const) {
      const values = g.boundary.integers({ min, max }).map((c) => c.value);
      expect(new Set(values).size, `range [${min},${max}]`).toBe(values.length);
    }
  });

  it('floats never emit the same value with contradictory valid flags', () => {
    for (const [min, max] of [[5, 5], [0, 1], [-1, 1], [2.5, 2.5]] as const) {
      const cases = g.boundary.floats({ min, max });
      const byValue = new Map<number, boolean>();
      for (const c of cases) {
        if (!Number.isFinite(c.value)) continue;
        if (byValue.has(c.value)) {
          expect(byValue.get(c.value), `range [${min},${max}] value ${c.value}`).toBe(c.valid);
        }
        byValue.set(c.value, c.valid);
      }
      // valid in-range cases must actually be in range
      for (const c of cases) {
        if (c.valid && Number.isFinite(c.value) && !Object.is(c.value, -0)) {
          expect(c.value).toBeGreaterThanOrEqual(min);
          expect(c.value).toBeLessThanOrEqual(max);
        }
      }
    }
  });

  it('strings dedupe on degenerate maxLength', () => {
    const values = g.boundary.strings({ maxLength: 0 }).map((c) => c.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('dates: the impossible-date case is genuinely unparseable', () => {
    const cases = g.boundary.dates({ min: '2026-01-01', max: '2026-12-31' });
    const impossible = cases.find((c) => c.label === 'impossible calendar date');
    expect(impossible).toBeDefined();
    expect(Number.isNaN(new Date(impossible!.value).getTime())).toBe(true);
  });

  it('dates: no duplicate values and min==max does not contradict', () => {
    const cases = g.boundary.dates({ min: '2026-06-01', max: '2026-06-01' });
    const validInRange = cases.filter((c) => c.valid && c.value instanceof Date);
    for (const c of validInRange) {
      expect((c.value as Date).getTime()).toBe(new Date('2026-06-01').getTime());
    }
  });
});

describe('regression: export handles bigint and heterogeneous rows', () => {
  it('toJSON serializes bigint instead of throwing', () => {
    const out = toJSON([{ big: 10n, huge: 99999999999999999999n }]);
    const parsed = JSON.parse(out);
    expect(parsed[0].big).toBe(10);
    expect(typeof parsed[0].huge).toBe('string'); // out of safe range → string
  });

  it('toCSV/toSQL include columns from ALL rows, not just the first', () => {
    const rows = [{ a: 1 }, { a: 2, b: 3 }];
    expect(toCSV(rows).split('\n')[0]).toBe('a,b');
    expect(toSQL('t', rows)).toContain('"a", "b"');
  });

  it('toSQL emits bigint unquoted', () => {
    expect(toSQL('t', [{ a: 42n }])).toContain('VALUES (42)');
  });
});

describe('regression: regex escapes', () => {
  it('handles \\xNN, \\uNNNN, \\u{...}, \\0 and [\\b]', () => {
    expect(g.string.fromRegex(/\x41/)).toBe('A');
    expect(g.string.fromRegex(/col\x6fr/)).toBe('color');
    expect(g.string.fromRegex(/[\x30-\x39]{4}/)).toMatch(/^\d{4}$/);
    expect(g.string.fromRegex(/[\b]/)).toBe('\b');
    expect(g.string.fromRegex(/A/)).toBe('A');
    expect(g.string.fromRegex(/\u{1F600}/u)).toBe('😀');
    expect(g.string.fromRegex(/\0/)).toBe('\0');
  });

  it('gives a clear error for {n,m} with n>m', () => {
    expect(() => g.string.fromRegex('a{5,2}')).toThrow(/min greater than max/);
  });
});
