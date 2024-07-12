import { cities, countries, lastNames, streetSuffixes } from '../data/en.js';
import { Module } from './base.js';

/** Addresses and geo coordinates. */
export class LocationModule extends Module {
  city(): string {
    return this.g.helpers.arrayElement(cities);
  }

  country(): string {
    return this.g.helpers.arrayElement(countries).name;
  }

  /** ISO 3166-1 alpha-2 country code, e.g. `"IN"`. */
  countryCode(): string {
    return this.g.helpers.arrayElement(countries).code;
  }

  /** Street name, e.g. `"Patel Avenue"`. */
  streetName(): string {
    return `${this.g.helpers.arrayElement(lastNames)} ${this.g.helpers.arrayElement(streetSuffixes)}`;
  }

  /** Street address, e.g. `"1234 Patel Avenue"`. */
  streetAddress(): string {
    return `${this.g.number.int({ min: 1, max: 9999 })} ${this.streetName()}`;
  }

  /** Zip/postal code from a symbol pattern (`#` = digit). Default `"#####"`. */
  zipCode(format = '#####'): string {
    return this.g.helpers.replaceSymbols(format);
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
