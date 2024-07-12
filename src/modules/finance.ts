import { currencies } from '../data/en.js';
import { Module } from './base.js';

export type CardIssuer = 'visa' | 'mastercard' | 'amex';

const CARD_PREFIXES: Record<CardIssuer, { prefix: string; length: number }> = {
  visa: { prefix: '4', length: 16 },
  mastercard: { prefix: '51', length: 16 },
  amex: { prefix: '34', length: 15 },
};

/** Computes the Luhn check digit for the given partial number. */
function luhnCheckDigit(partial: string): number {
  let sum = 0;
  // Double every other digit starting from the rightmost of the partial.
  for (let i = 0; i < partial.length; i++) {
    let digit = Number(partial[partial.length - 1 - i]);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  return (10 - (sum % 10)) % 10;
}

/** Financial values: amounts, currencies, Luhn-valid card numbers. */
export class FinanceModule extends Module {
  /** Amount as a fixed-decimal string, e.g. `"128.53"`. */
  amount(options: { min?: number; max?: number; fractionDigits?: number } = {}): string {
    const { min = 0, max = 1000, fractionDigits = 2 } = options;
    // Delegate rounding to number.float so the value is validated and clamped
    // to [min, max] (never exceeds max), then format with fixed decimals.
    return this.g.number.float({ min, max, fractionDigits }).toFixed(fractionDigits);
  }

  currency(): { code: string; name: string; symbol: string } {
    return this.g.helpers.arrayElement(currencies);
  }

  /** ISO 4217 code, e.g. `"INR"`. */
  currencyCode(): string {
    return this.currency().code;
  }

  currencyName(): string {
    return this.currency().name;
  }

  currencySymbol(): string {
    return this.currency().symbol;
  }

  /** Luhn-valid credit card number for the given issuer (default random). */
  creditCardNumber(options: { issuer?: CardIssuer } = {}): string {
    const issuer =
      options.issuer ??
      this.g.helpers.arrayElement(['visa', 'mastercard', 'amex'] as const);
    const { prefix, length } = CARD_PREFIXES[issuer];
    const body =
      prefix + this.g.string.numeric(length - prefix.length - 1);
    return body + String(luhnCheckDigit(body));
  }

  /** Card CVV (3 digits). */
  creditCardCVV(): string {
    return this.g.string.numeric(3);
  }

  /** PIN of the given length (default 4). */
  pin(length = 4): string {
    return this.g.string.numeric(length);
  }

  /** Account number of the given length (default 10). */
  accountNumber(length = 10): string {
    return this.g.string.numeric(length);
  }
}
