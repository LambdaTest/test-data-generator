import { describe, expect, it } from 'vitest';
import { TDGError, TestDataGenerator } from '../src/index.js';

const g = new TestDataGenerator({ seed: 42 });

describe('number', () => {
  it('int() stays within inclusive bounds and hits both edges', () => {
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const value = g.number.int({ min: 1, max: 5 });
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(5);
      expect(Number.isInteger(value)).toBe(true);
      seen.add(value);
    }

    expect(seen).toContain(1);
    expect(seen).toContain(5);
  });

  it('int(number) treats the argument as max', () => {
    for (let i = 0; i < 100; i++) {
      const value = g.number.int(3);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(3);
    }
  });

  it('int() rejects invalid ranges', () => {
    expect(() => g.number.int({ min: 10, max: 1 })).toThrow(TDGError);
    expect(() => g.number.int({ min: 0.5, max: 2 })).toThrow(TDGError);
  });

  it('float() respects bounds and fractionDigits', () => {
    for (let i = 0; i < 200; i++) {
      const value = g.number.float({ min: 2, max: 4, fractionDigits: 2 });
      expect(value).toBeGreaterThanOrEqual(2);
      expect(value).toBeLessThanOrEqual(4);
      expect(value).toBe(Math.round(value * 100) / 100);
    }
  });

  it('hex() produces lowercase hex of the right length', () => {
    expect(g.number.hex(8)).toMatch(/^[0-9a-f]{8}$/);
  });
});

describe('string', () => {
  it('fromCharacters() only uses the given charset', () => {
    const value = g.string.fromCharacters('ab', 100);
    expect(value).toMatch(/^[ab]{100}$/);
  });

  it('fromCharacters() supports length ranges', () => {
    for (let i = 0; i < 50; i++) {
      const value = g.string.alpha({ min: 3, max: 6 });
      expect(value.length).toBeGreaterThanOrEqual(3);
      expect(value.length).toBeLessThanOrEqual(6);
    }
  });

  it('respects casing options', () => {
    expect(g.string.alpha({ length: 50, casing: 'upper' })).toMatch(/^[A-Z]{50}$/);
    expect(g.string.alpha({ length: 50, casing: 'lower' })).toMatch(/^[a-z]{50}$/);
    expect(g.string.alphanumeric({ length: 50, casing: 'lower' })).toMatch(/^[a-z0-9]{50}$/);
  });

  it('numeric() produces digit strings', () => {
    expect(g.string.numeric(12)).toMatch(/^\d{12}$/);
  });

  it('rejects an empty charset', () => {
    expect(() => g.string.fromCharacters('', 5)).toThrow(TDGError);
  });
});
