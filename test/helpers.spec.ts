import { describe, expect, it } from 'vitest';
import { TDGError, TestDataGenerator } from '../src/index.js';

const g = new TestDataGenerator({ seed: 42 });

describe('helpers', () => {
  it('arrayElement() picks members and rejects empty arrays', () => {
    const items = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(items).toContain(g.helpers.arrayElement(items));
    }

    expect(() => g.helpers.arrayElement([])).toThrow(TDGError);
  });

  it('arrayElements() returns unique members of the requested size', () => {
    const items = [1, 2, 3, 4, 5];
    const picked = g.helpers.arrayElements(items, 3);
    expect(picked).toHaveLength(3);
    expect(new Set(picked).size).toBe(3);
    for (const item of picked) {
      expect(items).toContain(item);
    }
  });

  it('weighted() respects rough proportions', () => {
    let heads = 0;
    for (let i = 0; i < 2000; i++) {
      if (
        g.helpers.weighted([
          { weight: 9, value: 'heads' },
          { weight: 1, value: 'tails' },
        ]) === 'heads'
      ) {
        heads++;
      }
    }

    expect(heads / 2000).toBeGreaterThan(0.8);
    expect(heads / 2000).toBeLessThan(0.98);
  });

  it('weighted() rejects non-positive weights', () => {
    expect(() =>
      g.helpers.weighted([{ weight: 0, value: 'x' }])
    ).toThrow(TDGError);
  });

  it('shuffle() preserves members without mutating the input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const copy = [...input];
    const shuffled = g.helpers.shuffle(input);
    expect(input).toEqual(copy);
    expect([...shuffled].sort((a, b) => a - b)).toEqual(copy);
  });

  it('multiple() calls the factory with indices', () => {
    expect(g.helpers.multiple((i) => i * 2, { count: 4 })).toEqual([0, 2, 4, 6]);
  });

  it('maybe() honors probability extremes', () => {
    expect(g.helpers.maybe(() => 'x', { probability: 1 })).toBe('x');
    expect(g.helpers.maybe(() => 'x', { probability: 0 })).toBeUndefined();
  });

  it('replaceSymbols() substitutes #, ? and *', () => {
    const value = g.helpers.replaceSymbols('##-??-**!');
    expect(value).toMatch(/^\d{2}-[a-zA-Z]{2}-[a-zA-Z0-9]{2}!$/);
  });

  it('slugify() lowercases and strips special characters', () => {
    expect(g.helpers.slugify('Héllo Wörld! 42')).toBe('hello-world-42');
  });

  it('module methods survive destructuring', () => {
    const { fullName } = g.person;
    expect(typeof fullName()).toBe('string');
  });
});
