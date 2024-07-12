import { TDGError } from '../errors.js';
import { Module } from './base.js';

export interface IntOptions {
  /** Lower bound, inclusive. Default `0`. */
  min?: number;
  /** Upper bound, inclusive. Default `Number.MAX_SAFE_INTEGER`. */
  max?: number;
}

export interface FloatOptions {
  /** Lower bound, inclusive. Default `0`. */
  min?: number;
  /** Upper bound, exclusive. Default `1`. */
  max?: number;
  /** If set, round the result to this many fraction digits. */
  fractionDigits?: number;
}

/** Random numbers. The lowest-level module — everything else builds on it. */
export class NumberModule extends Module {
  /**
   * Random integer in [min, max], both inclusive.
   * Pass a number as shorthand for `{ max }`.
   */
  int(options: number | IntOptions = {}): number {
    const { min = 0, max = Number.MAX_SAFE_INTEGER } =
      typeof options === 'number' ? { max: options } : options;

    if (!Number.isInteger(min) || !Number.isInteger(max)) {
      throw new TDGError(`min (${min}) and max (${max}) must be integers.`);
    }

    if (min > max) {
      throw new TDGError(`min (${min}) cannot be greater than max (${max}).`);
    }

    return Math.floor(this.g.randomizer.next() * (max - min + 1)) + min;
  }

  /** Random float in [min, max). */
  float(options: FloatOptions = {}): number {
    const { min = 0, max = 1, fractionDigits } = options;

    if (min > max) {
      throw new TDGError(`min (${min}) cannot be greater than max (${max}).`);
    }

    if (fractionDigits !== undefined && (!Number.isInteger(fractionDigits) || fractionDigits < 0)) {
      throw new TDGError(`fractionDigits (${fractionDigits}) must be a non-negative integer.`);
    }

    const value = this.g.randomizer.next() * (max - min) + min;
    if (fractionDigits === undefined) {
      return value;
    }

    const factor = 10 ** fractionDigits;
    return Math.round(value * factor) / factor;
  }

  /** Random hex number string of the given length, e.g. `"a3f9"`. */
  hex(length = 1): string {
    return this.g.string.fromCharacters('0123456789abcdef', length);
  }
}
