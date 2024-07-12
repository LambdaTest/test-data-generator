import { describe, expect, it } from 'vitest';
import { TestDataGenerator } from '../src/index.js';

const g = new TestDataGenerator({ seed: 42 });

describe('security payloads', () => {
  it('every payload is flagged invalid and non-empty', () => {
    const all = g.security.all();
    expect(all.length).toBeGreaterThan(20);
    for (const c of all) {
      expect(c.valid).toBe(false);
      expect(typeof c.value).toBe('string');
      expect(c.value.length).toBeGreaterThan(0);
      expect(c.label.length).toBeGreaterThan(0);
    }
  });

  it('xss() contains recognizable script vectors', () => {
    const values = g.security.xss().map((c) => c.value);
    expect(values.some((v) => v.includes('<script>'))).toBe(true);
    expect(values.some((v) => v.includes('onerror'))).toBe(true);
  });

  it('sqlInjection() contains tautologies and stacked queries', () => {
    const values = g.security.sqlInjection().map((c) => c.value);
    expect(values.some((v) => v.includes("'1'='1"))).toBe(true);
    expect(values.some((v) => /drop table/i.test(v))).toBe(true);
  });

  it('pathTraversal() and commandInjection() are present', () => {
    expect(g.security.pathTraversal().some((c) => c.value.includes('../'))).toBe(true);
    expect(g.security.commandInjection().some((c) => c.value.includes('rm -rf'))).toBe(true);
  });

  it('all() is the union of the categories', () => {
    const expected =
      g.security.xss().length +
      g.security.sqlInjection().length +
      g.security.commandInjection().length +
      g.security.pathTraversal().length;
    expect(g.security.all()).toHaveLength(expected);
  });
});
