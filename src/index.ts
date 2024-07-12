export { TestDataGenerator, tdg, type TDGOptions } from './generator.js';
export {
  localeEntry,
  mergeLocales,
  type LocaleCategory,
  type LocaleData,
  type LocaleInput,
} from './locale.js';
export { de, en, es, hi_IN, locales, localeNames } from './locales/index.js';
export {
  toCSV,
  toJSON,
  toSQL,
  type CsvOptions,
  type Row,
  type SqlOptions,
} from './export.js';
export { runCli } from './cli.js';
export { Mulberry32, hashStringSeed, randomSeed, type Randomizer } from './random.js';
export { TDGError } from './errors.js';
export {
  createSchemaContext,
  resolveSchema,
  type FieldFn,
  type Infer,
  type Schema,
  type SchemaContext,
  type SchemaLiteral,
} from './schema.js';
export {
  resolveDataset,
  type DatasetCollection,
  type DatasetResult,
} from './dataset.js';
export { type FromRegexOptions } from './internal/regex-gen.js';

export { Module } from './modules/base.js';
export {
  BoundaryModule,
  type BoundaryCase,
  type DateBoundaryOptions,
  type FloatBoundaryOptions,
  type IntBoundaryOptions,
  type StringBoundaryOptions,
} from './modules/boundary.js';
export { SecurityModule } from './modules/security.js';
export { DateModule } from './modules/date.js';
export { FinanceModule, type CardIssuer } from './modules/finance.js';
export {
  HelpersModule,
  type Count,
  type UniqueFn,
  type WeightedEntry,
} from './modules/helpers.js';
export { IdModule } from './modules/id.js';
export { InternetModule, type EmailOptions } from './modules/internet.js';
export { LocationModule } from './modules/location.js';
export { LoremModule } from './modules/lorem.js';
export {
  NumberModule,
  type FloatOptions,
  type IntOptions,
} from './modules/number.js';
export { PersonModule } from './modules/person.js';
export { PhoneModule } from './modules/phone.js';
export { StringModule, type Casing, type Length } from './modules/string.js';
