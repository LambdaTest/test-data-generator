import { describe, expect, it } from 'vitest';
import { TDGError, TestDataGenerator } from '../src/index.js';

const g = new TestDataGenerator({ seed: 42 });

describe('helpers.fake (templates)', () => {
  it('substitutes tokens with generator output', () => {
    const out = g.helpers.fake('{{person.firstName}} {{person.lastName}}');
    expect(out).toMatch(/^\S+ \S+$/);
    expect(out).not.toContain('{{');
  });

  it('handles surrounding text and multiple tokens', () => {
    const out = g.helpers.fake('Hello {{person.firstName}}, code {{location.countryCode}}!');
    expect(out).toMatch(/^Hello \S+, code [A-Z]{2}!$/);
  });

  it('passes JSON arguments to methods', () => {
    for (let i = 0; i < 20; i++) {
      const out = g.helpers.fake('{{number.int({"min":10,"max":10})}}');
      expect(out).toBe('10');
    }

    const ranged = g.helpers.fake('{{number.int({"min":1,"max":3})}}');
    expect(['1', '2', '3']).toContain(ranged);
  });

  it('is deterministic under a fixed seed', () => {
    const a = new TestDataGenerator({ seed: 7 });
    const b = new TestDataGenerator({ seed: 7 });
    const tpl = '{{person.fullName}} <{{internet.email}}>';
    expect(a.helpers.fake(tpl)).toBe(b.helpers.fake(tpl));
  });

  it('throws on unknown module or method', () => {
    expect(() => g.helpers.fake('{{nope.method}}')).toThrow(TDGError);
    expect(() => g.helpers.fake('{{person.notAMethod}}')).toThrow(/not a generator method/);
  });

  it('throws on malformed arguments', () => {
    expect(() => g.helpers.fake('{{number.int(not-json)}}')).toThrow(/could not parse/);
  });
});
