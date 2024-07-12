import { TDGError } from '../errors.js';
import { Module } from './base.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_YEAR = 365.25 * MS_PER_DAY;

/**
 * Dates relative to a reference date. The reference defaults to "now" but can
 * be pinned via the generator's `refDate` option / `setRefDate()` so date
 * output is fully reproducible alongside the seed.
 */
export class DateModule extends Module {
  /** Random date in [from, to]. */
  between(options: { from: Date | string | number; to: Date | string | number }): Date {
    const from = new Date(options.from).getTime();
    const to = new Date(options.to).getTime();

    if (Number.isNaN(from) || Number.isNaN(to)) {
      throw new TDGError('between() received an invalid date.');
    }

    if (from > to) {
      throw new TDGError('from must be before to.');
    }

    return new Date(this.g.number.int({ min: from, max: to }));
  }

  /** Random date in the past, up to `years` (default 1) before the ref date. */
  past(options: { years?: number; refDate?: Date | string | number } = {}): Date {
    const { years = 1 } = options;
    const ref = new Date(options.refDate ?? this.g.refDate).getTime();
    return this.between({ from: ref - years * MS_PER_YEAR, to: ref - 1 });
  }

  /** Random date in the future, up to `years` (default 1) after the ref date. */
  future(options: { years?: number; refDate?: Date | string | number } = {}): Date {
    const { years = 1 } = options;
    const ref = new Date(options.refDate ?? this.g.refDate).getTime();
    return this.between({ from: ref + 1, to: ref + years * MS_PER_YEAR });
  }

  /** Random date within the last `days` (default 1). */
  recent(options: { days?: number; refDate?: Date | string | number } = {}): Date {
    const { days = 1 } = options;
    const ref = new Date(options.refDate ?? this.g.refDate).getTime();
    return this.between({ from: ref - days * MS_PER_DAY, to: ref - 1 });
  }

  /** Random date within the next `days` (default 1). */
  soon(options: { days?: number; refDate?: Date | string | number } = {}): Date {
    const { days = 1 } = options;
    const ref = new Date(options.refDate ?? this.g.refDate).getTime();
    return this.between({ from: ref + 1, to: ref + days * MS_PER_DAY });
  }

  /** Birthdate for an age between minAge and maxAge (defaults 18–65). */
  birthdate(
    options: { minAge?: number; maxAge?: number; refDate?: Date | string | number } = {}
  ): Date {
    const { minAge = 18, maxAge = 65 } = options;

    if (minAge > maxAge) {
      throw new TDGError(`minAge (${minAge}) cannot be greater than maxAge (${maxAge}).`);
    }

    const ref = new Date(options.refDate ?? this.g.refDate).getTime();
    return this.between({
      from: ref - (maxAge + 1) * MS_PER_YEAR + MS_PER_DAY,
      to: ref - minAge * MS_PER_YEAR,
    });
  }
}
