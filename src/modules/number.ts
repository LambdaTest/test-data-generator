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

    const span = max - min;
    // A single 32-bit draw resolves spans up to 2^32 exactly. For wider
    // ranges it would leave gaps (e.g. odd values unreachable), so combine
    // two draws into a 53-bit fraction. Narrow ranges keep the single-draw
    // path, so their output is unchanged.
    const fraction =
      span <= 0xffffffff ? this.g.randomizer.next() : this.highResFraction();
    return Math.floor(fraction * (span + 1)) + min;
  }

  /** A ~53-bit fraction in [0, 1) built from two randomizer draws. */
  private highResFraction(): number {
    const hi = Math.floor(this.g.randomizer.next() * 0x8000000); // 27 bits
    const lo = Math.floor(this.g.randomizer.next() * 0x4000000); // 26 bits
    return (hi * 0x4000000 + lo) / 0x20000000000000; // / 2^53
  }

  /** Random float in [min, max). */
  float(options: FloatOptions = {}): number {
    const { min = 0, max = 1, fractionDigits } = options;

    if (min > max) {
      throw new TDGError(`min (${min}) cannot be greater than max (${max}).`);
    }

    if (
      fractionDigits !== undefined &&
      (!Number.isInteger(fractionDigits) || fractionDigits < 0 || fractionDigits > 100)
    ) {
      throw new TDGError(`fractionDigits (${fractionDigits}) must be an integer between 0 and 100.`);
    }

    const value = this.g.randomizer.next() * (max - min) + min;
    if (fractionDigits === undefined) {
      return value;
    }

    // Rounding can push the value to `max` or below `min`; clamp back so the
    // result always stays within [min, max] (max becomes reachable here).
    const factor = 10 ** fractionDigits;
    const rounded = Math.round(value * factor) / factor;
    return Math.min(Math.max(rounded, min), max);
  }

  /** Random hex number string of the given length, e.g. `"a3f9"`. */
  hex(length = 1): string {
    return this.g.string.fromCharacters('0123456789abcdef', length);
  }
}
