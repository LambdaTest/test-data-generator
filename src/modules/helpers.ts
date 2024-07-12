import { TDGError } from '../errors.js';
import { Module } from './base.js';

export interface WeightedEntry<T> {
  weight: number;
  value: T;
}

export type Count = number | { min: number; max: number };

/** A generator wrapped by `uniqueFactory()` — never returns the same value twice. */
export interface UniqueFn<T> {
  (): T;
  /** Forgets all previously returned values. */
  clear: () => void;
  /** Number of distinct values returned so far. */
  seenCount: () => number;
}

/** Generic utilities that make composing generators convenient. */
export class HelpersModule extends Module {
  private readonly uniqueStores = new Map<string, Set<unknown>>();

  /**
   * Returns a value from `fn` that has not been returned before (per scope).
   * Uniqueness is by primitive value (`Set` semantics). Throws a TDGError
   * once `maxRetries` consecutive draws produce only already-seen values.
   *
   * @example
   * g.helpers.unique(() => g.internet.email(), { scope: 'emails' })
   */
  unique<T>(
    fn: () => T,
    options: { scope?: string; maxRetries?: number } = {}
  ): T {
    const { scope = 'default', maxRetries = 50 } = options;
    let store = this.uniqueStores.get(scope);
    if (!store) {
      store = new Set();
      this.uniqueStores.set(scope, store);
    }

    return this.drawUnique(fn, store, maxRetries);
  }

  /** Clears one unique scope, or all scopes when called without arguments. */
  clearUnique(scope?: string): void {
    if (scope === undefined) {
      this.uniqueStores.clear();
    } else {
      this.uniqueStores.delete(scope);
    }
  }

  /**
   * Wraps `fn` with its own private seen-set. Prefer this over `unique()`
   * when generating batches — no scope-name collisions possible.
   *
   * @example
   * const email = g.helpers.uniqueFactory(() => g.internet.email());
   * g.fromSchema({ email: () => email() }, 1000); // 1000 distinct emails
   */
  uniqueFactory<T>(
    fn: () => T,
    options: { maxRetries?: number } = {}
  ): UniqueFn<T> {
    const { maxRetries = 50 } = options;
    const seen = new Set<unknown>();
    const wrapped = (() => this.drawUnique(fn, seen, maxRetries)) as UniqueFn<T>;
    wrapped.clear = () => seen.clear();
    wrapped.seenCount = () => seen.size;
    return wrapped;
  }

  private drawUnique<T>(fn: () => T, seen: Set<unknown>, maxRetries: number): T {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const candidate = fn();
      if (!seen.has(candidate)) {
        seen.add(candidate);
        return candidate;
      }
    }

    throw new TDGError(
      `unique: no new unique value after ${maxRetries} attempts (${seen.size} values already used). Widen the value space, raise maxRetries, or clear the store.`
    );
  }
  /** Random element from a non-empty array. */
  arrayElement<const T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new TDGError('arrayElement() requires a non-empty array.');
    }

    return array[this.g.number.int({ max: array.length - 1 })] as T;
  }

  /** Random subset (without replacement) of the given size. */
  arrayElements<const T>(array: readonly T[], count?: Count): T[] {
    const requested =
      count === undefined
        ? this.g.number.int({ max: array.length })
        : typeof count === 'number'
          ? count
          : this.g.number.int(count);
    // Clamp into [0, array.length] so a negative count can't slice from the
    // end (slice(0, -n)) and an oversized count can't exceed the array.
    const size = Math.max(0, Math.min(requested, array.length));
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

  /**
   * Resolves a mustache-style template by calling generator methods.
   * Each `{{module.method}}` is replaced by the string result of
   * `g.module.method()`. Arguments are supported via JSON:
   * `{{number.int({"min":1,"max":9})}}`.
   *
   * Resolution is a single left-to-right pass over the ORIGINAL template, so
   * there is no token limit and a generator whose output happens to contain
   * `{{...}}` is never re-interpreted as a template.
   *
   * @example
   * g.helpers.fake('{{person.fullName}} <{{internet.email}}>');
   * // 'Maya Fischer <maya.fischer@proton.me>'
   */
  fake(template: string): string {
    const tokenPattern = /\{\{\s*([a-zA-Z]+)\.([a-zA-Z]+)\s*(\([\s\S]*?\))?\s*\}\}/g;
    return template.replace(
      tokenPattern,
      (_match, moduleName: string, methodName: string, rawArgs?: string) => {
        const mod = (this.g as unknown as Record<string, unknown>)[moduleName];
        if (mod == null || typeof mod !== 'object') {
          throw new TDGError(`fake: unknown module '${moduleName}' in template.`);
        }

        const method = (mod as Record<string, unknown>)[methodName];
        if (typeof method !== 'function') {
          throw new TDGError(`fake: '${moduleName}.${methodName}' is not a generator method.`);
        }

        const args = this.parseFakeArgs(rawArgs, `${moduleName}.${methodName}`);
        return String((method as (...a: unknown[]) => unknown)(...args));
      }
    );
  }

  private parseFakeArgs(rawArgs: string | undefined, where: string): unknown[] {
    if (!rawArgs) return [];
    const inner = rawArgs.slice(1, -1).trim();
    if (inner === '') return [];
    try {
      // Wrap in array brackets so multiple comma-separated JSON args parse.
      return JSON.parse(`[${inner}]`) as unknown[];
    } catch {
      throw new TDGError(`fake: could not parse arguments for '${where}'. Use JSON, e.g. {{number.int({"min":1,"max":9})}}.`);
    }
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
