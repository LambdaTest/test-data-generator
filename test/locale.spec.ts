import { describe, expect, it } from 'vitest';
import { TDGError, TestDataGenerator, mergeLocales, type LocaleData } from '../src/index.js';

describe('locales', () => {
  it('generates locale-specific names', () => {
    const de = new TestDataGenerator({ seed: 42, locale: 'de' });
    const deNames = new Set(de.locale.person?.firstNames);
    for (let i = 0; i < 30; i++) {
      expect(deNames.has(de.person.firstName())).toBe(true);
    }

    const hi = new TestDataGenerator({ seed: 42, locale: 'hi_IN' });
    expect(hi.location.country()).toBe('India');
  });

  it('defaults to English', () => {
    const g = new TestDataGenerator({ seed: 1 });
    expect(g.locale.metadata.code).toBe('en');
  });

  it('falls back to en for data a locale omits', () => {
    // de provides no jobTitles → falls back to en's list.
    const de = new TestDataGenerator({ seed: 42, locale: 'de' });
    expect(typeof de.person.jobTitle()).toBe('string');
    expect(de.person.jobTitle().length).toBeGreaterThan(0);
  });

  it('honors a custom fallback chain (first wins)', () => {
    const custom: LocaleData = {
      metadata: { code: 'xx', name: 'Custom' },
      person: { firstNames: ['Zeta'] },
    };
    const g = new TestDataGenerator({ seed: 5, locale: [custom, 'de'] });
    expect(g.person.firstName()).toBe('Zeta'); // from custom
    // lastNames not in custom → from de
    expect(g.locale.person?.lastNames).toContain('Müller');
  });

  it('uses the locale zip format', () => {
    const hi = new TestDataGenerator({ seed: 42, locale: 'hi_IN' });
    expect(hi.location.zipCode()).toMatch(/^\d{6}$/); // India = 6 digits
    const en = new TestDataGenerator({ seed: 42 });
    expect(en.location.zipCode()).toMatch(/^\d{5}$/);
  });

  it('throws on unknown locale names', () => {
    expect(() => new TestDataGenerator({ locale: 'xyz' })).toThrow(TDGError);
  });

  it('mergeLocales merges left-to-right', () => {
    const merged = mergeLocales([
      { metadata: { code: 'a', name: 'A' }, person: { firstNames: ['A'] } },
      { metadata: { code: 'b', name: 'B' }, person: { firstNames: ['B'], lastNames: ['Bee'] } },
    ]);
    expect(merged.person?.firstNames).toEqual(['A']); // first wins
    expect(merged.person?.lastNames).toEqual(['Bee']); // filled from second
  });

  it('is deterministic per locale', () => {
    const a = new TestDataGenerator({ seed: 'x', locale: 'es' });
    const b = new TestDataGenerator({ seed: 'x', locale: 'es' });
    expect(a.person.fullName()).toBe(b.person.fullName());
  });
});
