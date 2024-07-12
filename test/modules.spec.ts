import { describe, expect, it } from 'vitest';
import { TestDataGenerator } from '../src/index.js';

const REF = new Date('2026-01-15T12:00:00Z');
const g = new TestDataGenerator({ seed: 42, refDate: REF });

/** Luhn validity check (independent implementation for verification). */
function isLuhnValid(cardNumber: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = cardNumber.length - 1; i >= 0; i--) {
    let digit = Number(cardNumber[i]);
    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
}

describe('person', () => {
  it('generates names and job titles', () => {
    expect(g.person.fullName()).toMatch(/^\S+ \S+$/);
    expect(g.person.jobTitle().length).toBeGreaterThan(0);
  });
});

describe('internet', () => {
  it('email() looks like an email and honors overrides', () => {
    for (let i = 0; i < 50; i++) {
      expect(g.internet.email()).toMatch(/^[a-z0-9._-]+@[a-z0-9.-]+\.[a-z]+$/i);
    }

    const email = g.internet.email({
      firstName: 'Ada',
      lastName: 'Lovelace',
      provider: 'example.com',
    });
    expect(email).toMatch(/^ada[._]?lovelace\d*@example\.com$/);
  });

  it('ip(), ipv6() and mac() have the right shapes', () => {
    expect(g.internet.ip()).toMatch(/^(\d{1,3}\.){3}\d{1,3}$/);
    for (const octet of g.internet.ip().split('.')) {
      expect(Number(octet)).toBeLessThanOrEqual(255);
    }

    expect(g.internet.ipv6()).toMatch(/^([0-9a-f]{4}:){7}[0-9a-f]{4}$/);
    expect(g.internet.mac()).toMatch(/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/);
  });

  it('url() and password() behave', () => {
    expect(g.internet.url()).toMatch(/^https:\/\/[a-z]+\.[a-z]+(\/[a-z]+)?$/);
    expect(g.internet.url({ protocol: 'http' })).toMatch(/^http:\/\//);
    expect(g.internet.password({ length: 20 })).toHaveLength(20);
  });

  it('httpStatusCode() returns known codes', () => {
    const known = new Set([200, 201, 204, 301, 302, 400, 401, 403, 404, 429, 500, 502, 503]);
    for (let i = 0; i < 50; i++) {
      expect(known).toContain(g.internet.httpStatusCode());
    }
  });
});

describe('location', () => {
  it('generates coherent address parts', () => {
    expect(g.location.streetAddress()).toMatch(/^\d{1,4} \S+.* \S+$/);
    expect(g.location.zipCode()).toMatch(/^\d{5}$/);
    expect(g.location.zipCode('###-###')).toMatch(/^\d{3}-\d{3}$/);
    expect(g.location.countryCode()).toMatch(/^[A-Z]{2}$/);
  });

  it('coordinates are within valid ranges', () => {
    for (let i = 0; i < 50; i++) {
      const { latitude, longitude } = g.location.coordinates();
      expect(Math.abs(latitude)).toBeLessThanOrEqual(90);
      expect(Math.abs(longitude)).toBeLessThanOrEqual(180);
    }
  });
});

describe('date', () => {
  it('past()/future()/recent()/soon() respect the pinned refDate', () => {
    for (let i = 0; i < 50; i++) {
      expect(g.date.past().getTime()).toBeLessThan(REF.getTime());
      expect(g.date.future().getTime()).toBeGreaterThan(REF.getTime());

      const recent = g.date.recent({ days: 5 });
      expect(REF.getTime() - recent.getTime()).toBeLessThanOrEqual(5 * 86_400_000);

      const soon = g.date.soon({ days: 5 });
      expect(soon.getTime() - REF.getTime()).toBeLessThanOrEqual(5 * 86_400_000);
    }
  });

  it('between() stays in range and validates input', () => {
    const from = new Date('2020-01-01');
    const to = new Date('2021-01-01');
    for (let i = 0; i < 50; i++) {
      const value = g.date.between({ from, to });
      expect(value.getTime()).toBeGreaterThanOrEqual(from.getTime());
      expect(value.getTime()).toBeLessThanOrEqual(to.getTime());
    }

    expect(() => g.date.between({ from: to, to: from })).toThrow();
  });

  it('birthdate() produces ages within the requested window', () => {
    for (let i = 0; i < 100; i++) {
      const birthdate = g.date.birthdate({ minAge: 18, maxAge: 30 });
      const age =
        (REF.getTime() - birthdate.getTime()) / (365.25 * 86_400_000);
      expect(age).toBeGreaterThanOrEqual(18);
      expect(age).toBeLessThan(31);
    }
  });
});

describe('id', () => {
  it('uuid() is a valid v4 UUID', () => {
    for (let i = 0; i < 50; i++) {
      expect(g.id.uuid()).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
      );
    }
  });

  it('nanoid() and hex() have the right lengths', () => {
    expect(g.id.nanoid()).toHaveLength(21);
    expect(g.id.nanoid(10)).toHaveLength(10);
    expect(g.id.hex()).toMatch(/^[0-9a-f]{24}$/);
  });
});

describe('finance', () => {
  it('creditCardNumber() is Luhn-valid for every issuer', () => {
    for (const issuer of ['visa', 'mastercard', 'amex'] as const) {
      for (let i = 0; i < 25; i++) {
        const card = g.finance.creditCardNumber({ issuer });
        expect(isLuhnValid(card), `${issuer}: ${card}`).toBe(true);
      }
    }

    expect(g.finance.creditCardNumber({ issuer: 'visa' })).toMatch(/^4\d{15}$/);
    expect(g.finance.creditCardNumber({ issuer: 'amex' })).toMatch(/^34\d{13}$/);
  });

  it('amount() formats within range', () => {
    for (let i = 0; i < 50; i++) {
      const amount = g.finance.amount({ min: 10, max: 20 });
      expect(amount).toMatch(/^\d+\.\d{2}$/);
      expect(Number(amount)).toBeGreaterThanOrEqual(10);
      expect(Number(amount)).toBeLessThanOrEqual(20);
    }
  });

  it('currency data is coherent', () => {
    const currency = g.finance.currency();
    expect(currency.code).toMatch(/^[A-Z]{3}$/);
    expect(currency.name.length).toBeGreaterThan(0);
  });
});

describe('lorem', () => {
  it('generates words, sentences and slugs', () => {
    expect(g.lorem.words(4).split(' ')).toHaveLength(4);
    expect(g.lorem.sentence()).toMatch(/^[A-Z].*\.$/);
    expect(g.lorem.slug(3)).toMatch(/^[a-z]+-[a-z]+-[a-z]+$/);
    expect(g.lorem.paragraph().split('. ').length).toBeGreaterThanOrEqual(3);
  });
});

describe('phone', () => {
  it('formats numbers from patterns', () => {
    expect(g.phone.number()).toMatch(/^\d{3}-\d{3}-\d{4}$/);
    expect(g.phone.number('+91 ##### #####')).toMatch(/^\+91 \d{5} \d{5}$/);
    expect(g.phone.international()).toMatch(/^\+\d{11,12}$/);
  });
});
