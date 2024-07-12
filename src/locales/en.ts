import { cities, countries, firstNames, jobTitles, lastNames, streetSuffixes } from '../data/en.js';
import type { LocaleData } from '../locale.js';

export const en: LocaleData = {
  metadata: { code: 'en', name: 'English' },
  person: { firstNames, lastNames, jobTitles },
  location: { cities, countries, streetSuffixes, zipFormat: '#####' },
};
