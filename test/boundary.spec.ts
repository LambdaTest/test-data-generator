import { describe, expect, it } from 'vitest';
import { TDGError, TestDataGenerator } from '../src/index.js';

const g = new TestDataGenerator({ seed: 42 });

describe('boundary.integers', () => {
  it('covers min, max and out-of-range values', () => {
    const cases = g.boundary.integers({ min: 1, max: 100 });
    const byLabel = new Map(cases.map((c) => [c.label, c]));

    expect(byLabel.get('below minimum')).toMatchObject({ value: 0, valid: false });
    expect(byLabel.get('at minimum')).toMatchObject({ value: 1, valid: true });
    expect(byLabel.get('just above minimum')).toMatchObject({ value: 2, valid: true });
    expect(byLabel.get('just below maximum')).toMatchObject({ value: 99, valid: true });
    expect(byLabel.get('at maximum')).toMatchObject({ value: 100, valid: true });
    expect(byLabel.get('above maximum')).toMatchObject({ value: 101, valid: false });
  });

  it('marks validity consistently with the range', () => {
    for (const c of g.boundary.integers({ min: -5, max: 5 })) {
      expect(c.valid).toBe(c.value >= -5 && c.value <= 5);
    }
  });

  it('can exclude invalid cases and handles tiny ranges', () => {
    const cases = g.boundary.integers({ min: 3, max: 3, includeInvalid: false });
    expect(cases).toEqual([{ value: 3, label: 'at minimum', valid: true }]);
  });

  it('rejects inverted ranges', () => {
    expect(() => g.boundary.integers({ min: 5, max: 1 })).toThrow(TDGError);
  });
});

describe('boundary.strings', () => {
  it('covers length edges with correct validity', () => {
    const cases = g.boundary.strings({ minLength: 3, maxLength: 8 });
    const byLabel = new Map(cases.map((c) => [c.label, c]));

    expect(byLabel.get('empty string')).toMatchObject({ value: '', valid: false });
    expect(byLabel.get('below minimum length')?.value).toHaveLength(2);
    expect(byLabel.get('below minimum length')?.valid).toBe(false);
    expect(byLabel.get('at minimum length')?.value).toHaveLength(3);
    expect(byLabel.get('at maximum length')?.value).toHaveLength(8);
    expect(byLabel.get('above maximum length')?.value).toHaveLength(9);
    expect(byLabel.get('above maximum length')?.valid).toBe(false);
    expect(byLabel.get('unicode characters')?.valid).toBe(true);
  });

  it('treats empty string as valid when minLength is 0', () => {
    const empty = g.boundary
      .strings({ maxLength: 5 })
      .find((c) => c.label === 'empty string');
    expect(empty?.valid).toBe(true);
  });
});

describe('boundary.emails', () => {
  it('provides both valid and invalid samples', () => {
    const cases = g.boundary.emails();
    const valid = cases.filter((c) => c.valid);
    const invalid = cases.filter((c) => !c.valid);

    expect(valid.length).toBeGreaterThanOrEqual(3);
    expect(invalid.length).toBeGreaterThanOrEqual(6);

    // The generated "typical email" must itself look valid.
    expect(valid[0]?.value).toMatch(/^\S+@\S+\.\S+$/);

    // Every case is usable directly in test.each
    for (const c of cases) {
      expect(typeof c.value).toBe('string');
      expect(c.label.length).toBeGreaterThan(0);
    }
  });
});
