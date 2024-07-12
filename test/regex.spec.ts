import { describe, expect, it } from 'vitest';
import { TDGError, TestDataGenerator } from '../src/index.js';

const g = new TestDataGenerator({ seed: 42 });

describe('string.fromRegex', () => {
  const patterns: RegExp[] = [
    /^[A-Z]{2}-\d{4}$/,
    /^(foo|bar|baz)-\d+$/,
    /^[a-f0-9]{8}$/,
    /^\w+@\w+\.(com|org)$/,
    /^.{5}$/,
    /^a*b+c?$/,
    /^[^0-9]{3}$/,
    /^\d{2,4}$/,
    /^colou?r$/,
    /^https?:\/\/[a-z]{3,8}\.(io|dev)$/,
    /^IN-[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/, // vehicle plate style
    /^\+91 \d{5} \d{5}$/,
    /^v\d+\.\d+\.\d+(-rc\.\d)?$/, // semver-ish
  ];

  it.each(patterns.map((p) => [p.source, p] as const))(
    'generates values matching /%s/',
    (_source, pattern) => {
      for (let i = 0; i < 25; i++) {
        const value = g.string.fromRegex(pattern);
        expect(value).toMatch(pattern);
      }
    }
  );

  it('accepts string patterns', () => {
    const value = g.string.fromRegex('^[A-Z]{3}\\d{3}$');
    expect(value).toMatch(/^[A-Z]{3}\d{3}$/);
  });

  it('caps unbounded quantifiers via maxRepetition', () => {
    for (let i = 0; i < 50; i++) {
      const value = g.string.fromRegex(/^a+$/, { maxRepetition: 2 });
      expect(value.length).toBeGreaterThanOrEqual(1);
      expect(value.length).toBeLessThanOrEqual(3);
    }
  });

  it('is deterministic under a fixed seed', () => {
    const a = new TestDataGenerator({ seed: 5 });
    const b = new TestDataGenerator({ seed: 5 });
    for (let i = 0; i < 10; i++) {
      expect(a.string.fromRegex(/^[A-Z]{2}-\d{4}$/)).toBe(
        b.string.fromRegex(/^[A-Z]{2}-\d{4}$/)
      );
    }
  });

  it('supports non-capturing and named groups', () => {
    expect(g.string.fromRegex(/^(?:ab|cd)$/)).toMatch(/^(ab|cd)$/);
    expect(g.string.fromRegex(/^(?<code>[A-Z]{2})\d$/)).toMatch(/^[A-Z]{2}\d$/);
  });

  it('rejects unsupported constructs with clear errors', () => {
    expect(() => g.string.fromRegex(/(?=a)b/)).toThrow(TDGError);
    expect(() => g.string.fromRegex('(a)\\1')).toThrow(/backreferences/);
    expect(() => g.string.fromRegex(/a\b/)).toThrow(/word boundaries/);
    expect(() => g.string.fromRegex('[a')).toThrow(/unterminated/);
    expect(() => g.string.fromRegex('(ab')).toThrow(TDGError);
  });
});
