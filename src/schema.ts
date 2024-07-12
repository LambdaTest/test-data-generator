import type { TestDataGenerator } from './generator.js';

export interface SchemaContext {
  /** Index of the record being generated (0 for single records). */
  index: number;
}

/** A field resolver: receives the generator and per-record context. */
export type FieldFn<T = unknown> = (g: TestDataGenerator, ctx: SchemaContext) => T;

/**
 * A schema maps field names to either a resolver function, a nested schema,
 * or a literal value (copied as-is).
 */
export interface Schema {
  [key: string]: FieldFn | Schema | unknown;
}

/** Infers the generated record type from a schema. */
export type Infer<S> = {
  [K in keyof S]: S[K] extends FieldFn<infer T>
    ? T
    : S[K] extends Date | unknown[]
      ? S[K]
      : S[K] extends object
        ? Infer<S[K]>
        : S[K];
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

export function resolveSchema<S extends Schema>(
  g: TestDataGenerator,
  schema: S,
  ctx: SchemaContext
): Infer<S> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (typeof value === 'function') {
      result[key] = (value as FieldFn)(g, ctx);
    } else if (isPlainObject(value)) {
      result[key] = resolveSchema(g, value as Schema, ctx);
    } else {
      result[key] = value;
    }
  }

  return result as Infer<S>;
}
