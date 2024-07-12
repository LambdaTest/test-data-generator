import type { LocaleData } from '../locale.js';

/** German locale. Names/addresses provided; anything else falls back to `en`. */
export const de: LocaleData = {
  metadata: { code: 'de', name: 'German' },
  person: {
    firstNames: [
      'Alexander', 'Anna', 'Ben', 'Clara', 'David', 'Elias', 'Emilia', 'Emma',
      'Felix', 'Finn', 'Hannah', 'Jonas', 'Julia', 'Laura', 'Lena', 'Leon',
      'Lukas', 'Marie', 'Max', 'Mia', 'Niklas', 'Noah', 'Paul', 'Sarah',
      'Sophie', 'Tim', 'Tom',
    ],
    lastNames: [
      'Bauer', 'Becker', 'Fischer', 'Hoffmann', 'Klein', 'Koch', 'Krause',
      'Lehmann', 'Meyer', 'Müller', 'Neumann', 'Richter', 'Schäfer', 'Schmidt',
      'Schneider', 'Schulz', 'Schwarz', 'Wagner', 'Weber', 'Werner', 'Wolf',
      'Zimmermann',
    ],
  },
  location: {
    cities: [
      'Berlin', 'Bremen', 'Dortmund', 'Dresden', 'Düsseldorf', 'Essen',
      'Frankfurt', 'Hamburg', 'Hannover', 'Köln', 'Leipzig', 'München',
      'Nürnberg', 'Stuttgart',
    ],
    countries: [
      { name: 'Deutschland', code: 'DE' },
      { name: 'Österreich', code: 'AT' },
      { name: 'Schweiz', code: 'CH' },
    ],
    streetSuffixes: ['straße', 'weg', 'allee', 'platz', 'gasse', 'ring'],
    zipFormat: '#####',
  },
};
