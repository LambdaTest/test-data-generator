import {
  resolveDataset,
  type DatasetCollection,
  type DatasetResult,
} from './dataset.js';
import { TDGError } from './errors.js';
import {
  localeEntry,
  mergeLocales,
  type LocaleCategory,
  type LocaleData,
  type LocaleInput,
} from './locale.js';
import { en, locales } from './locales/index.js';
import { Mulberry32, randomSeed, type Randomizer } from './random.js';
import {
  createSchemaContext,
  resolveSchema,
  type Infer,
  type Schema,
} from './schema.js';
import { BoundaryModule } from './modules/boundary.js';
import { DateModule } from './modules/date.js';
import { FinanceModule } from './modules/finance.js';
import { HelpersModule } from './modules/helpers.js';
import { IdModule } from './modules/id.js';
import { InternetModule } from './modules/internet.js';
import { LocationModule } from './modules/location.js';
import { LoremModule } from './modules/lorem.js';
import { NumberModule } from './modules/number.js';
import { PersonModule } from './modules/person.js';
import { PhoneModule } from './modules/phone.js';
import { SecurityModule } from './modules/security.js';
import { StringModule } from './modules/string.js';

export interface TDGOptions {
  /** Seed for deterministic output. Numbers and strings both work. */
  seed?: number | string;
  /** Custom randomness source. Defaults to a seeded mulberry32 PRNG. */
  randomizer?: Randomizer;
  /**
   * Reference date for relative date generation (`date.past()` etc.).
   * Pin this alongside the seed for fully reproducible output.
   * Defaults to "now" at call time.
   */
  refDate?: Date | string | number | (() => Date);
  /**
   * Locale for names/addresses. A built-in name (`'en'`, `'de'`, `'es'`,
   * `'hi_IN'`), a custom `LocaleData` pack, or a fallback chain. The `en`
   * pack is always appended as the final fallback. Defaults to `'en'`.
   */
  locale?: LocaleInput | LocaleInput[];
}

/**
 * The generator facade. Construct with a seed for deterministic data, or use
 * the shared `tdg` instance for convenience.
 *
 * @example
 * const g = new TestDataGenerator({ seed: 42 });
 * g.person.fullName(); // same value on every run
 */
export class TestDataGenerator {
  readonly randomizer: Randomizer;

  readonly boundary: BoundaryModule = new BoundaryModule(this);
  readonly date: DateModule = new DateModule(this);
  readonly finance: FinanceModule = new FinanceModule(this);
  readonly helpers: HelpersModule = new HelpersModule(this);
  readonly id: IdModule = new IdModule(this);
  readonly internet: InternetModule = new InternetModule(this);
  readonly location: LocationModule = new LocationModule(this);
  readonly lorem: LoremModule = new LoremModule(this);
  readonly number: NumberModule = new NumberModule(this);
  readonly person: PersonModule = new PersonModule(this);
  readonly phone: PhoneModule = new PhoneModule(this);
  readonly security: SecurityModule = new SecurityModule(this);
  readonly string: StringModule = new StringModule(this);

  /** The resolved locale data (chosen locale merged over the `en` fallback). */
  readonly locale: LocaleData;

  private refDateSource: () => Date;

  constructor(options: TDGOptions = {}) {
    this.randomizer = options.randomizer ?? new Mulberry32(options.seed);
    if (options.randomizer && options.seed !== undefined) {
      this.randomizer.seed(options.seed);
    }

    this.locale = TestDataGenerator.resolveLocale(options.locale);
    this.refDateSource = TestDataGenerator.toRefDateSource(options.refDate);
  }

  private static resolveLocale(
    locale: TDGOptions['locale']
  ): LocaleData {
    const inputs = locale === undefined ? [] : Array.isArray(locale) ? locale : [locale];
    const packs = inputs.map((input) => {
      if (typeof input !== 'string') return input;
      const pack = locales[input];
      if (!pack) {
        throw new TDGError(
          `Unknown locale '${input}'. Built-in locales: ${Object.keys(locales).join(', ')}.`
        );
      }

      return pack;
    });

    // Always append `en` as the final fallback.
    return mergeLocales([...packs, en]);
  }

  /** Reads a locale array (e.g. `person.firstNames`), used by locale-aware modules. */
  localeEntry<T>(category: LocaleCategory, key: string): T[] {
    return localeEntry<T>(this.locale, category, key);
  }

  private static toRefDateSource(
    refDate: TDGOptions['refDate']
  ): () => Date {
    if (refDate === undefined) {
      return () => new Date();
    }

    if (typeof refDate === 'function') {
      return refDate;
    }

    const pinned = new Date(refDate);
    return () => new Date(pinned);
  }

  /** The reference date used by relative date methods. */
  get refDate(): Date {
    return this.refDateSource();
  }

  /** Pins (or re-derives) the reference date for relative date methods. */
  setRefDate(refDate: Date | string | number | (() => Date)): void {
    this.refDateSource = TestDataGenerator.toRefDateSource(refDate);
  }

  /**
   * Re-seeds the randomizer, resetting the random stream. Called with no
   * argument, picks a random seed and returns it so failures can be replayed:
   *
   * @example
   * const seed = tdg.seed(); // log this on test failure
   * tdg.seed(seed);          // replay the exact same data
   */
  seed(seed: number | string = randomSeed()): number | string {
    this.randomizer.seed(seed);
    return seed;
  }

  /** Generates a single record from a schema. */
  fromSchema<S extends Schema>(schema: S): Infer<S>;
  /** Generates `count` records from a schema. */
  fromSchema<S extends Schema>(schema: S, count: number): Array<Infer<S>>;
  fromSchema<S extends Schema>(
    schema: S,
    count?: number
  ): Infer<S> | Array<Infer<S>> {
    if (count === undefined) {
      return resolveSchema(this, schema, createSchemaContext({ index: 0 }));
    }

    return Array.from({ length: count }, (_, index) =>
      resolveSchema(this, schema, createSchemaContext({ index }))
    );
  }

  /**
   * Generates a relational dataset: named collections resolved in declaration
   * order. Later collections reference earlier ones via `ctx.entities.<name>`
   * or generate children per parent via `each` — foreign keys stay valid.
   *
   * @example
   * const db = g.dataset({
   *   users: { count: 10, schema: { id: (g) => g.id.uuid() } },
   *   orders: {
   *     each: { of: 'users', count: { min: 1, max: 3 } },
   *     schema: { userId: (_g, ctx) => ctx.parent.id },
   *   },
   * });
   */
  dataset<D extends Record<string, DatasetCollection>>(
    definition: D
  ): DatasetResult<D> {
    return resolveDataset(this, definition) as DatasetResult<D>;
  }
}

/** Shared default instance (unseeded — call `tdg.seed(...)` for determinism). */
export const tdg: TestDataGenerator = new TestDataGenerator();
