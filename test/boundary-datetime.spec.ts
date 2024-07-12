import { describe, expect, it } from 'vitest';
import { TDGError, TestDataGenerator } from '../src/index.js';

const g = new TestDataGenerator({ seed: 42 });

describe('boundary.floats', () => {
  it('covers edges with correct validity', () => {
    const cases = g.boundary.floats({ min: 0, max: 1 });
    const byLabel = new Map(cases.map((c) => [c.label, c]));

    expect(byLabel.get('at minimum')?.value).toBe(0);
    expect(byLabel.get('at maximum')?.value).toBe(1);
    expect(byLabel.get('midpoint')?.value).toBe(0.5);
    expect(byLabel.get('just below minimum')?.valid).toBe(false);
    expect(byLabel.get('just above maximum')?.valid).toBe(false);
  });

  it('in-range values are actually within [min, max]', () => {
    for (const c of g.boundary.floats({ min: 2.5, max: 7.5, includeInvalid: false })) {
      expect(c.valid).toBe(true);
      expect(c.value).toBeGreaterThanOrEqual(2.5);
      expect(c.value).toBeLessThanOrEqual(7.5);
    }
  });

  it('includes NaN and Infinity as invalid cases', () => {
    const labels = g.boundary.floats({ min: 0, max: 10 }).map((c) => c.label);
    expect(labels).toContain('NaN');
    expect(labels).toContain('positive infinity');
    expect(labels).toContain('negative infinity');
  });

  it('rejects inverted ranges', () => {
    expect(() => g.boundary.floats({ min: 5, max: 1 })).toThrow(TDGError);
  });
});

describe('boundary.dates', () => {
  const min = new Date('2026-01-01T00:00:00Z');
  const max = new Date('2026-12-31T23:59:59Z');

  it('covers edges with correct validity', () => {
    const cases = g.boundary.dates({ min, max });
    const byLabel = new Map(cases.map((c) => [c.label, c]));

    expect((byLabel.get('at minimum')?.value as Date).getTime()).toBe(min.getTime());
    expect((byLabel.get('at maximum')?.value as Date).getTime()).toBe(max.getTime());
    expect(byLabel.get('just before minimum')?.valid).toBe(false);
    expect(byLabel.get('just after maximum')?.valid).toBe(false);
  });

  it('valid in-range dates fall within [min, max]', () => {
    for (const c of g.boundary.dates({ min, max, includeInvalid: false })) {
      const t = new Date(c.value).getTime();
      expect(t).toBeGreaterThanOrEqual(min.getTime());
      expect(t).toBeLessThanOrEqual(max.getTime());
    }
  });

  it('includes malformed-date cases', () => {
    const labels = g.boundary.dates({ min, max }).map((c) => c.label);
    expect(labels).toContain('unparseable string');
    expect(labels).toContain('impossible calendar date');
    expect(labels).toContain('Invalid Date object');
  });

  it('rejects inverted or invalid ranges', () => {
    expect(() => g.boundary.dates({ min: max, max: min })).toThrow(TDGError);
    expect(() => g.boundary.dates({ min: 'nope', max })).toThrow(TDGError);
  });
});
