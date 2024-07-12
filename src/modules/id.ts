import { Module } from './base.js';

const NANOID_ALPHABET =
  'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

/** Identifiers: UUIDs, nanoids, hex ids. All seed-deterministic. */
export class IdModule extends Module {
  /** RFC 4122 version 4 UUID, drawn from the seeded randomizer. */
  uuid(): string {
    const bytes = Array.from({ length: 16 }, () =>
      this.g.number.int({ max: 255 })
    );
    bytes[6] = ((bytes[6] as number) & 0x0f) | 0x40;
    bytes[8] = ((bytes[8] as number) & 0x3f) | 0x80;

    const hex = bytes.map((b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  /** URL-safe nanoid-style id (default length 21). */
  nanoid(length = 21): string {
    return this.g.string.fromCharacters(NANOID_ALPHABET, length);
  }

  /** Hex id of the given length (default 24, MongoDB ObjectId shaped). */
  hex(length = 24): string {
    return this.g.number.hex(length);
  }
}
