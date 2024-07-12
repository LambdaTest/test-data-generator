import { Module } from './base.js';

/** Addresses and geo coordinates. Address data comes from the active locale. */
export class LocationModule extends Module {
  city(): string {
    return this.g.helpers.arrayElement(
      this.g.localeEntry<string>('location', 'cities')
    );
  }

  private countries(): Array<{ name: string; code: string }> {
    return this.g.localeEntry<{ name: string; code: string }>(
      'location',
      'countries'
    );
  }

  country(): string {
    return this.g.helpers.arrayElement(this.countries()).name;
  }

  /** ISO 3166-1 alpha-2 country code, e.g. `"IN"`. */
  countryCode(): string {
    return this.g.helpers.arrayElement(this.countries()).code;
  }

  /** Street name, e.g. `"Patel Avenue"`. */
  streetName(): string {
    const lastName = this.g.helpers.arrayElement(
      this.g.localeEntry<string>('person', 'lastNames')
    );
    const suffix = this.g.helpers.arrayElement(
      this.g.localeEntry<string>('location', 'streetSuffixes')
    );
    return `${lastName} ${suffix}`;
  }

  /** Street address, e.g. `"1234 Patel Avenue"`. */
  streetAddress(): string {
    return `${this.g.number.int({ min: 1, max: 9999 })} ${this.streetName()}`;
  }

  /** Zip/postal code. Defaults to the locale's format (`#` = digit). */
  zipCode(format?: string): string {
    const resolved =
      format ??
      (this.g.locale.location?.zipFormat as string | undefined) ??
      '#####';
    return this.g.helpers.replaceSymbols(resolved);
  }

  latitude(options: { min?: number; max?: number; precision?: number } = {}): number {
    const { min = -90, max = 90, precision = 6 } = options;
    return this.g.number.float({ min, max, fractionDigits: precision });
  }

  longitude(options: { min?: number; max?: number; precision?: number } = {}): number {
    const { min = -180, max = 180, precision = 6 } = options;
    return this.g.number.float({ min, max, fractionDigits: precision });
  }

  /** `{ latitude, longitude }` pair. */
  coordinates(): { latitude: number; longitude: number } {
    return { latitude: this.latitude(), longitude: this.longitude() };
  }
}
