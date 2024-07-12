import { domainSuffixes, freeEmailProviders, loremWords } from '../data/en.js';
import { Module } from './base.js';

export interface EmailOptions {
  firstName?: string;
  lastName?: string;
  /** Domain to use, e.g. `"example.com"`. Default: a random free provider. */
  provider?: string;
}

const PASSWORD_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-';

/** Internet-related values: emails, usernames, URLs, IPs, passwords. */
export class InternetModule extends Module {
  /** Email address, optionally derived from a specific name. */
  email(options: EmailOptions = {}): string {
    const first = options.firstName ?? this.g.person.firstName();
    const last = options.lastName ?? this.g.person.lastName();
    const provider =
      options.provider ?? this.g.helpers.arrayElement(freeEmailProviders);

    const separator = this.g.helpers.arrayElement(['.', '_', '']);
    const suffix = this.g.helpers.maybe(
      () => String(this.g.number.int({ min: 1, max: 99 })),
      { probability: 0.4 }
    );

    const local = this.sanitizeLocalPart(
      `${this.g.helpers.slugify(first)}${separator}${this.g.helpers.slugify(last)}${suffix ?? ''}`
    );
    return `${local}@${provider}`;
  }

  /**
   * Ensures an email local part is RFC-valid: collapses repeated dots, strips
   * leading/trailing separators, and falls back to a generated handle when the
   * inputs slugify to nothing (e.g. empty or non-Latin names).
   */
  private sanitizeLocalPart(raw: string): string {
    const cleaned = raw
      .replace(/\.{2,}/g, '.')
      .replace(/^[._-]+/, '')
      .replace(/[._-]+$/, '');
    return cleaned === ''
      ? `user${this.g.number.int({ min: 1, max: 9999 })}`
      : cleaned;
  }

  /** Username, e.g. `"priya_nakamura42"`. */
  username(): string {
    const first = this.g.helpers.slugify(this.g.person.firstName());
    const last = this.g.helpers.slugify(this.g.person.lastName());
    const separator = this.g.helpers.arrayElement(['_', '.', '']);
    const suffix = this.g.helpers.maybe(
      () => String(this.g.number.int({ min: 1, max: 999 })),
      { probability: 0.6 }
    );
    return this.sanitizeLocalPart(`${first}${separator}${last}${suffix ?? ''}`);
  }

  /** Domain name, e.g. `"quiet-otter.dev"`. */
  domainName(): string {
    const word = this.g.helpers.arrayElement(loremWords);
    const suffix = this.g.helpers.arrayElement(domainSuffixes);
    return `${word}.${suffix}`;
  }

  /** URL, e.g. `"https://voluptas.io/path"`. */
  url(options: { protocol?: 'http' | 'https' } = {}): string {
    const { protocol = 'https' } = options;
    const path = this.g.helpers.maybe(
      () => `/${this.g.helpers.arrayElement(loremWords)}`,
      { probability: 0.5 }
    );
    return `${protocol}://${this.domainName()}${path ?? ''}`;
  }

  /** IPv4 address. */
  ip(): string {
    return Array.from({ length: 4 }, () =>
      this.g.number.int({ max: 255 })
    ).join('.');
  }

  /** IPv6 address. */
  ipv6(): string {
    return Array.from({ length: 8 }, () => this.g.number.hex(4)).join(':');
  }

  /** MAC address, e.g. `"5c:f2:0a:81:d3:44"`. */
  mac(): string {
    return Array.from({ length: 6 }, () => this.g.number.hex(2)).join(':');
  }

  /** Random password of the given length (letters, digits, symbols). */
  password(options: { length?: number } = {}): string {
    const { length = 15 } = options;
    return this.g.string.fromCharacters(PASSWORD_CHARS, length);
  }

  /** Common HTTP status code, weighted toward 200. */
  httpStatusCode(): number {
    return this.g.helpers.weighted([
      { weight: 10, value: 200 },
      { weight: 3, value: 201 },
      { weight: 2, value: 204 },
      { weight: 2, value: 301 },
      { weight: 3, value: 302 },
      { weight: 4, value: 400 },
      { weight: 3, value: 401 },
      { weight: 2, value: 403 },
      { weight: 4, value: 404 },
      { weight: 1, value: 429 },
      { weight: 3, value: 500 },
      { weight: 1, value: 502 },
      { weight: 1, value: 503 },
    ]);
  }
}
