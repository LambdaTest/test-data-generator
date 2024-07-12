import { Module } from './base.js';

/** Phone numbers. */
export class PhoneModule extends Module {
  /**
   * Phone number from a symbol pattern (`#` = digit).
   * Default `"###-###-####"`.
   */
  number(format = '###-###-####'): string {
    return this.g.helpers.replaceSymbols(format);
  }

  /** E.164-style international number, e.g. `"+14155550132"`. */
  international(): string {
    const countryCode = this.g.number.int({ min: 1, max: 99 });
    return `+${countryCode}${this.g.string.numeric(10)}`;
  }
}
