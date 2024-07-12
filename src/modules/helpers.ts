import { TDGError } from '../errors.js';
import { Module } from './base.js';

export interface WeightedEntry<T> {
  weight: number;
  value: T;
}

export type Count = number | { min: number; max: number };

/** Generic utilities that make composing generators convenient. */
export class HelpersModule extends Module {
  /** Random element from a non-empty array. */
  arrayElement<const T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new TDGError('arrayElement() requires a non-empty array.');
    }

    return array[this.g.number.int({ max: array.length - 1 })] as T;
  }

  /** Random subset (without replacement) of the given size. */
  arrayElements<const T>(array: readonly T[], count?: Count): T[] {
    const size = Math.min(
      count === undefined
        ? this.g.number.int({ max: array.length })
        : typeof count === 'number'
          ? count
          : this.g.number.int(count),
      array.length
    );
    return this.shuffle(array).slice(0, size);
  }

  /** Random value, where each entry's probability is weight / total weight. */
  weighted<const T>(entries: ReadonlyArray<WeightedEntry<T>>): T {
    if (entries.length === 0) {
      throw new TDGError('weighted() requires a non-empty array.');
    }

    const total = entries.reduce((sum, { weight }) => {
      if (weight <= 0 || !Number.isFinite(weight)) {
        throw new TDGError('weighted() requires all weights to be positive finite numbers.');
      }

      return sum + weight;
    }, 0);

    const target = this.g.randomizer.next() * total;
    let cumulative = 0;
    for (const { weight, value } of entries) {
      cumulative += weight;
      if (target < cumulative) {
        return value;
      }
    }

    // Floating point edge: fall back to the last entry.
    return (entries[entries.length - 1] as WeightedEntry<T>).value;
  }

  /** Fisher–Yates shuffle. Returns a new array; the input is not mutated. */
  shuffle<const T>(array: readonly T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.g.number.int({ max: i });
      [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }

    return copy;
  }

  /** Calls `fn(index)` `count` times and returns the results. */
  multiple<const T>(fn: (index: number) => T, options: { count?: Count } = {}): T[] {
    const { count = 3 } = options;
    const size = typeof count === 'number' ? count : this.g.number.int(count);
    return Array.from({ length: size }, (_, index) => fn(index));
  }

  /** Returns `fn()` with the given probability, otherwise `undefined`. */
  maybe<const T>(fn: () => T, options: { probability?: number } = {}): T | undefined {
    const { probability = 0.5 } = options;
    return this.boolean(probability) ? fn() : undefined;
  }

  /** Random boolean, `true` with the given probability (default 0.5). */
  boolean(probability = 0.5): boolean {
    if (probability < 0 || probability > 1) {
      throw new TDGError(`probability (${probability}) must be between 0 and 1.`);
    }

    return this.g.randomizer.next() < probability;
  }

  /**
   * Replaces symbols in a pattern:
   * `#` → digit, `?` → letter, `*` → digit or letter.
   * Example: `replaceSymbols('##-???-**')` → `"42-AbC-7x"`.
   */
  replaceSymbols(pattern: string): string {
    let result = '';
    for (const char of pattern) {
      switch (char) {
        case '#':
          result += this.g.string.numeric();
          break;
        case '?':
          result += this.g.string.alpha();
          break;
        case '*':
          result += this.g.string.alphanumeric();
          break;
        default:
          result += char;
      }
    }

    return result;
  }

  /** Lowercases and replaces non-alphanumeric runs with `-`. */
  slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
