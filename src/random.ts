/**
 * The interface between the generator and its source of randomness.
 * Implement this to plug in any PRNG (e.g. from `pure-rand`).
 */
export interface Randomizer {
  /** Returns the next random float in [0, 1). */
  next(): number;
  /** Resets the internal state from the given seed. */
  seed(seed: number | string): void;
}

/**
 * xmur3 string hash — turns a string seed into a 32-bit integer seed.
 */
export function hashStringSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** Returns a random 32-bit seed (non-deterministic; used when no seed is given). */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000);
}

/**
 * Default Randomizer: mulberry32 — a small, fast, high-quality-enough
 * 32-bit PRNG with fully deterministic output for a given seed.
 */
export class Mulberry32 implements Randomizer {
  private state = 0;

  constructor(seed: number | string = randomSeed()) {
    this.seed(seed);
  }

  seed(seed: number | string): void {
    this.state =
      typeof seed === 'string' ? hashStringSeed(seed) : Math.trunc(seed) >>> 0;
  }

  next(): number {
    let t = (this.state = (this.state + 0x6d2b79f5) | 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
}
