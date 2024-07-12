import type { LocaleData } from '../locale.js';
import { de } from './de.js';
import { en } from './en.js';
import { es } from './es.js';
import { hi_IN } from './hi_IN.js';

export { de, en, es, hi_IN };

/** All built-in locales, keyed by code. */
export const locales: Record<string, LocaleData> = { en, de, es, hi_IN };

/** Names of all built-in locales. */
export const localeNames = Object.keys(locales);
