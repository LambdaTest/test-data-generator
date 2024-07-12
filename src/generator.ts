import { Mulberry32, randomSeed, type Randomizer } from './random.js';
import { resolveSchema, type Infer, type Schema } from './schema.js';
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
  readonly string: StringModule = new StringModule(this);

  private refDateSource: () => Date;

  constructor(options: TDGOptions = {}) {
    this.randomizer = options.randomizer ?? new Mulberry32(options.seed);
    if (options.randomizer && options.seed !== undefined) {
      this.randomizer.seed(options.seed);
    }

    this.refDateSource = TestDataGenerator.toRefDateSource(options.refDate);
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
      return resolveSchema(this, schema, { index: 0 });
    }

    return Array.from({ length: count }, (_, index) =>
      resolveSchema(this, schema, { index })
    );
  }
}

/** Shared default instance (unseeded — call `tdg.seed(...)` for determinism). */
export const tdg: TestDataGenerator = new TestDataGenerator();
