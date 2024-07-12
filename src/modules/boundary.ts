import { TDGError } from '../errors.js';
import { Module } from './base.js';

/**
 * A single boundary-value test case. `valid` tells you whether the value is
 * inside the constraint — feed the whole array to `test.each` and assert
 * acceptance/rejection based on it.
 */
export interface BoundaryCase<T> {
  value: T;
  label: string;
  valid: boolean;
}

export interface IntBoundaryOptions {
  min: number;
  max: number;
  /** Include out-of-range (invalid) cases. Default `true`. */
  includeInvalid?: boolean;
}

export interface StringBoundaryOptions {
  minLength?: number;
  maxLength: number;
  /** Characters to build the strings from. Default lowercase letters. */
  charset?: string;
  /** Include out-of-range (invalid) cases. Default `true`. */
  includeInvalid?: boolean;
}

/**
 * Boundary-value and negative test data — the cases QA actually needs:
 * values at, just inside, and just outside the edges of a constraint.
 */
export class BoundaryModule extends Module {
  /** Boundary cases for an inclusive integer range. */
  integers(options: IntBoundaryOptions): BoundaryCase<number>[] {
    const { min, max, includeInvalid = true } = options;

    if (min > max) {
      throw new TDGError(`min (${min}) cannot be greater than max (${max}).`);
    }

    const cases: BoundaryCase<number>[] = [];
    if (includeInvalid) {
      cases.push({ value: min - 1, label: 'below minimum', valid: false });
    }

    cases.push({ value: min, label: 'at minimum', valid: true });
    if (min + 1 <= max) {
      cases.push({ value: min + 1, label: 'just above minimum', valid: true });
    }

    const middle = Math.floor((min + max) / 2);
    if (middle > min + 1 && middle < max - 1) {
      cases.push({ value: middle, label: 'middle of range', valid: true });
    }

    if (max - 1 > min + 1) {
      cases.push({ value: max - 1, label: 'just below maximum', valid: true });
    }

    if (max > min) {
      cases.push({ value: max, label: 'at maximum', valid: true });
    }

    if (includeInvalid) {
      cases.push({ value: max + 1, label: 'above maximum', valid: false });
    }

    return cases;
  }

  /** Boundary cases for a string-length constraint. */
  strings(options: StringBoundaryOptions): BoundaryCase<string>[] {
    const { minLength = 0, maxLength, charset = 'abcdefghijklmnopqrstuvwxyz', includeInvalid = true } = options;

    if (minLength > maxLength) {
      throw new TDGError(`minLength (${minLength}) cannot be greater than maxLength (${maxLength}).`);
    }

    const make = (length: number): string =>
      this.g.string.fromCharacters(charset, length);

    const cases: BoundaryCase<string>[] = [
      { value: '', label: 'empty string', valid: minLength === 0 },
    ];

    if (minLength > 1 && includeInvalid) {
      cases.push({ value: make(minLength - 1), label: 'below minimum length', valid: false });
    }

    if (minLength > 0) {
      cases.push({ value: make(minLength), label: 'at minimum length', valid: true });
    }

    cases.push({ value: make(maxLength), label: 'at maximum length', valid: true });

    if (includeInvalid) {
      cases.push({ value: make(maxLength + 1), label: 'above maximum length', valid: false });
      cases.push({
        value: ' '.repeat(Math.max(minLength, 1)),
        label: 'whitespace only',
        valid: false,
      });
    }

    const withinRange = Math.max(minLength, Math.min(4, maxLength));
    cases.push({
      value: 'ñéü你好'.slice(0, withinRange).padEnd(withinRange, 'é'),
      label: 'unicode characters',
      valid: true,
    });

    return cases;
  }

  /** Valid and invalid email samples for negative testing. */
  emails(): BoundaryCase<string>[] {
    return [
      { value: this.g.internet.email(), label: 'typical email', valid: true },
      { value: 'first.last+tag@sub.example.co', label: 'plus addressing and subdomain', valid: true },
      { value: 'a@b.co', label: 'shortest reasonable email', valid: true },
      { value: '', label: 'empty string', valid: false },
      { value: 'plainaddress', label: 'missing @ and domain', valid: false },
      { value: '@example.com', label: 'missing local part', valid: false },
      { value: 'user@', label: 'missing domain', valid: false },
      { value: 'user@example', label: 'missing TLD', valid: false },
      { value: 'user name@example.com', label: 'space in local part', valid: false },
      { value: 'user@@example.com', label: 'double @', valid: false },
      { value: 'user@example..com', label: 'consecutive dots in domain', valid: false },
    ];
  }
}
