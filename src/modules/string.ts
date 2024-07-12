import { TDGError } from '../errors.js';
import { Module } from './base.js';

export type Casing = 'upper' | 'lower' | 'mixed';

export type Length = number | { min: number; max: number };

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

function charsForCasing(casing: Casing): string {
  switch (casing) {
    case 'upper':
      return UPPER;
    case 'lower':
      return LOWER;
    case 'mixed':
      return LOWER + UPPER;
  }
}

/** Random strings built from character sets. */
export class StringModule extends Module {
  /** The core primitive: a string of `length` chars drawn from `characters`. */
  fromCharacters(characters: string | readonly string[], length: Length = 1): string {
    if (characters.length === 0) {
      throw new TDGError('characters must not be empty.');
    }

    const resolvedLength =
      typeof length === 'number' ? length : this.g.number.int(length);
    let result = '';
    for (let i = 0; i < resolvedLength; i++) {
      const index = this.g.number.int({ max: characters.length - 1 });
      result += characters[index];
    }

    return result;
  }

  /** Random letters, e.g. `"fqGdeZ"`. */
  alpha(options: Length | { length?: Length; casing?: Casing } = 1): string {
    const opts =
      typeof options === 'number' || 'min' in (options as object)
        ? { length: options as Length }
        : (options as { length?: Length; casing?: Casing });
    return this.fromCharacters(charsForCasing(opts.casing ?? 'mixed'), opts.length ?? 1);
  }

  /** Random letters and digits. */
  alphanumeric(options: Length | { length?: Length; casing?: Casing } = 1): string {
    const opts =
      typeof options === 'number' || 'min' in (options as object)
        ? { length: options as Length }
        : (options as { length?: Length; casing?: Casing });
    return this.fromCharacters(
      charsForCasing(opts.casing ?? 'mixed') + DIGITS,
      opts.length ?? 1
    );
  }

  /** Random digit string. Note: may start with `0`, so treat it as a string. */
  numeric(length: Length = 1): string {
    return this.fromCharacters(DIGITS, length);
  }

  /** Random printable-ASCII sample string. */
  sample(length: Length = 10): string {
    const printable =
      LOWER + UPPER + DIGITS + ' !"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';
    return this.fromCharacters(printable, length);
  }
}
