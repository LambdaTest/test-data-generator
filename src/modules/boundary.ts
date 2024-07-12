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

export interface FloatBoundaryOptions {
  min: number;
  max: number;
  /** Smallest meaningful step past an edge. Default `Number.EPSILON`. */
  epsilon?: number;
  /** Include out-of-range and special (NaN/Infinity) cases. Default `true`. */
  includeInvalid?: boolean;
}

export interface DateBoundaryOptions {
  min: Date | string | number;
  max: Date | string | number;
  /** Step past an edge, in milliseconds. Default `1`. */
  stepMs?: number;
  /** Include out-of-range and malformed-date cases. Default `true`. */
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

    // On tiny ranges some edges coincide (e.g. [1,2] → "just above minimum"
    // and "at maximum" are both 2). Dedupe by value, keeping the later
    // (more canonical edge) label so no value is tested twice.
    return dedupeByValue(cases);
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

    // Degenerate constraints (e.g. maxLength: 0) can make several cases the
    // same string; dedupe so no value is emitted twice.
    return dedupeByValue(cases);
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

  /** Boundary cases for an inclusive floating-point range. */
  floats(options: FloatBoundaryOptions): BoundaryCase<number>[] {
    const { min, max, epsilon = Number.EPSILON, includeInvalid = true } = options;

    if (min > max) {
      throw new TDGError(`min (${min}) cannot be greater than max (${max}).`);
    }

    const nudge = (v: number, dir: 1 | -1): number => {
      const step = Math.max(Math.abs(v) * epsilon, epsilon);
      return v + dir * step;
    };

    const cases: BoundaryCase<number>[] = [];
    if (includeInvalid) {
      cases.push({ value: nudge(min, -1), label: 'just below minimum', valid: false });
    }

    cases.push({ value: min, label: 'at minimum', valid: true });

    // Interior cases only exist when the range is non-degenerate; on min==max
    // a nudge would land OUTSIDE [min,max] yet be labeled valid.
    if (min < max) {
      const above = nudge(min, 1);
      if (above < max) cases.push({ value: above, label: 'just above minimum', valid: true });
      cases.push({ value: (min + max) / 2, label: 'midpoint', valid: true });
      const below = nudge(max, -1);
      if (below > min) cases.push({ value: below, label: 'just below maximum', valid: true });
      cases.push({ value: max, label: 'at maximum', valid: true });
    }

    if (includeInvalid) {
      cases.push(
        { value: nudge(max, 1), label: 'just above maximum', valid: false },
        { value: Number.NaN, label: 'NaN', valid: false },
        { value: Number.POSITIVE_INFINITY, label: 'positive infinity', valid: false },
        { value: Number.NEGATIVE_INFINITY, label: 'negative infinity', valid: false },
        { value: -0, label: 'negative zero', valid: min <= 0 && max >= 0 }
      );
    }

    return dedupeByValue(cases);
  }

  /** Boundary cases for an inclusive date range. */
  dates(options: DateBoundaryOptions): BoundaryCase<Date | string>[] {
    const { stepMs = 1, includeInvalid = true } = options;
    const min = new Date(options.min).getTime();
    const max = new Date(options.max).getTime();

    if (Number.isNaN(min) || Number.isNaN(max)) {
      throw new TDGError('dates() received an invalid min/max.');
    }

    if (min > max) {
      throw new TDGError('min must be before or equal to max.');
    }

    const cases: BoundaryCase<Date | string>[] = [];
    if (includeInvalid) {
      cases.push({ value: new Date(min - stepMs), label: 'just before minimum', valid: false });
    }

    cases.push({ value: new Date(min), label: 'at minimum', valid: true });

    // Interior points only exist for a non-degenerate range; on min==max they
    // would fall outside [min,max] yet be labeled valid.
    if (min < max) {
      const after = min + stepMs;
      if (after < max) cases.push({ value: new Date(after), label: 'just after minimum', valid: true });
      cases.push({ value: new Date((min + max) / 2), label: 'midpoint', valid: true });
      const before = max - stepMs;
      if (before > min) cases.push({ value: new Date(before), label: 'just before maximum', valid: true });
      cases.push({ value: new Date(max), label: 'at maximum', valid: true });
    }

    if (includeInvalid) {
      cases.push(
        { value: new Date(max + stepMs), label: 'just after maximum', valid: false },
        { value: 'not-a-date', label: 'unparseable string', valid: false },
        // Month 13 → NaN in JS. (Note: '2026-02-30' would silently roll over
        // to March 2, so it is NOT a reliably-invalid string.)
        { value: '2026-13-01', label: 'impossible calendar date', valid: false },
        { value: new Date(Number.NaN), label: 'Invalid Date object', valid: false }
      );
    }

    return dedupeByValue(cases, (v) =>
      v instanceof Date ? `t${v.getTime()}` : `s${v}`
    );
  }
}

/**
 * Removes cases whose value collides (later label wins — the more canonical
 * edge). `-0` is kept distinct from `0` so the negative-zero case survives.
 */
function dedupeByValue<T>(
  cases: BoundaryCase<T>[],
  keyOf: (value: T) => unknown = (value) => value
): BoundaryCase<T>[] {
  const map = new Map<unknown, BoundaryCase<T>>();
  for (const c of cases) {
    const key = keyOf(c.value);
    map.set(Object.is(key, -0) ? '-0' : key, c);
  }

  return [...map.values()];
}
