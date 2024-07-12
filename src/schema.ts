import type { TestDataGenerator } from './generator.js';

export interface SchemaContext {
  /** Index of the record being generated (0 for single records). */
  index: number;
  /**
   * The partially-resolved record. Fields resolve in declaration order, so
   * later fields can read earlier ones — e.g. derive `email` from `firstName`.
   */
  record: Record<string, any>;
  /** Previously generated collections when running inside `dataset()`. */
  entities: Record<string, any[]>;
  /** The parent record when generating per-parent collections (`each`). */
  parent?: any;
}

/** A field resolver: receives the generator and per-record context. */
export type FieldFn<T = unknown> = (g: TestDataGenerator, ctx: SchemaContext) => T;

/** Literal values allowed in a schema — copied into the record as-is. */
export type SchemaLiteral =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined
  | Date
  | unknown[];

/**
 * A schema maps field names to either a resolver function, a nested schema,
 * or a literal value (copied as-is). The union deliberately excludes
 * `unknown` so field functions get contextual parameter types.
 */
export interface Schema {
  [key: string]: FieldFn | Schema | SchemaLiteral;
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

export function createSchemaContext(init: {
  index: number;
  entities?: Record<string, any[]>;
  parent?: any;
}): SchemaContext {
  return {
    index: init.index,
    record: {},
    entities: init.entities ?? {},
    parent: init.parent,
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}

function resolveInto(
  g: TestDataGenerator,
  schema: Schema,
  ctx: SchemaContext,
  target: Record<string, unknown>
): Record<string, unknown> {
  for (const [key, value] of Object.entries(schema)) {
    if (typeof value === 'function') {
      target[key] = (value as FieldFn)(g, ctx);
    } else if (isPlainObject(value)) {
      target[key] = resolveInto(g, value as Schema, ctx, {});
    } else {
      target[key] = value;
    }
  }

  return target;
}

export function resolveSchema<S extends Schema>(
  g: TestDataGenerator,
  schema: S,
  ctx: SchemaContext
): Infer<S> {
  // Top-level fields resolve directly into ctx.record so later fields
  // (including fields inside nested schemas) can reference earlier ones.
  return resolveInto(g, schema, ctx, ctx.record) as Infer<S>;
}
