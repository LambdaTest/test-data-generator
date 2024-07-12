import { TDGError } from './errors.js';

/**
 * A locale data pack. Every field is optional — missing fields fall back to
 * the `en` pack (which is always appended as the final fallback), so a locale
 * only needs to provide what differs.
 */
export interface LocaleData {
  metadata: { code: string; name: string };
  person?: {
    firstNames?: string[];
    lastNames?: string[];
    jobTitles?: string[];
  };
  location?: {
    cities?: string[];
    countries?: Array<{ name: string; code: string }>;
    streetSuffixes?: string[];
    zipFormat?: string;
  };
}

export type LocaleCategory = Exclude<keyof LocaleData, 'metadata'>;

/** A built-in locale name or a custom data pack. */
export type LocaleInput = string | LocaleData;

/**
 * Merges packs left-to-right: the first pack that provides a value wins.
 * Used to build fallback chains like `[hi_IN, en]`.
 */
export function mergeLocales(packs: LocaleData[]): LocaleData {
  if (packs.length === 0) {
    throw new TDGError('mergeLocales: at least one locale is required.');
  }

  const merged: LocaleData = { metadata: packs[0]!.metadata };
  for (const pack of packs) {
    for (const key of Object.keys(pack) as Array<keyof LocaleData>) {
      if (key === 'metadata') continue;
      const category = pack[key];
      if (!category) continue;
      const existing = (merged[key] ?? {}) as Record<string, unknown>;
      // Earlier packs win → only fill keys not already set.
      merged[key] = { ...(category as object), ...existing } as never;
    }
  }

  return merged;
}

/**
 * Reads a locale array (e.g. `person.firstNames`) with a clear error when the
 * data is missing from both the chosen locale and its fallbacks.
 */
export function localeEntry<T>(
  locale: LocaleData,
  category: LocaleCategory,
  key: string
): T[] {
  const group = locale[category] as Record<string, unknown> | undefined;
  const value = group?.[key];
  if (!Array.isArray(value)) {
    throw new TDGError(
      `Locale data for '${category}.${key}' is missing in locale '${locale.metadata.code}'. Provide it in a custom locale pack or use a locale that includes it.`
    );
  }

  return value as T[];
}
