import { TDGError } from './errors.js';
import type { TestDataGenerator } from './generator.js';
import type { Count } from './modules/helpers.js';
import {
  createSchemaContext,
  resolveSchema,
  type Infer,
  type Schema,
} from './schema.js';

export interface DatasetCollection<S extends Schema = Schema> {
  schema: S;
  /** Number of records — fixed or `{min,max}`. Default 1. Ignored when `each` is set. */
  count?: Count;
  /**
   * Generate records per parent record of a previously declared collection.
   * Field resolvers receive the parent via `ctx.parent`, guaranteeing valid
   * foreign keys — e.g. `userId: (g, ctx) => ctx.parent.id`.
   */
  each?: { of: string; count?: Count };
}

export type DatasetResult<D extends Record<string, DatasetCollection>> = {
  [K in keyof D]: Array<Infer<D[K]['schema']>>;
};

function resolveCount(g: TestDataGenerator, count: Count): number {
  return typeof count === 'number' ? count : g.number.int(count);
}

/**
 * Resolves collections in declaration order. Later collections can reference
 * earlier ones via `ctx.entities.<name>` (random association) or generate a
 * fixed number of children per parent via `each` (guaranteed association).
 */
export function resolveDataset(
  g: TestDataGenerator,
  definition: Record<string, DatasetCollection>
): Record<string, unknown[]> {
  const entities: Record<string, any[]> = {};

  for (const [name, collection] of Object.entries(definition)) {
    const rows: unknown[] = [];

    if (collection.each) {
      const parents = entities[collection.each.of];
      if (!parents) {
        throw new TDGError(
          `dataset: collection '${name}' references '${collection.each.of}', which is not declared before it. Parent collections must come first.`
        );
      }

      for (const parent of parents) {
        const perParent = resolveCount(g, collection.each.count ?? 1);
        for (let i = 0; i < perParent; i++) {
          rows.push(
            resolveSchema(
              g,
              collection.schema,
              createSchemaContext({ index: rows.length, entities, parent })
            )
          );
        }
      }
    } else {
      const total = resolveCount(g, collection.count ?? 1);
      for (let i = 0; i < total; i++) {
        rows.push(
          resolveSchema(
            g,
            collection.schema,
            createSchemaContext({ index: i, entities })
          )
        );
      }
    }

    entities[name] = rows;
  }

  return entities;
}
