import type { LocaleData } from '../locale.js';

/** Hindi / India locale. */
export const hi_IN: LocaleData = {
  metadata: { code: 'hi_IN', name: 'Hindi (India)' },
  person: {
    firstNames: [
      'Aarav', 'Aditi', 'Ananya', 'Arjun', 'Diya', 'Isha', 'Ishaan', 'Kabir',
      'Kavya', 'Krishna', 'Meera', 'Mohit', 'Neha', 'Priya', 'Rahul', 'Riya',
      'Rohan', 'Sanjay', 'Saanvi', 'Sneha', 'Vihaan', 'Vivaan',
    ],
    lastNames: [
      'Agarwal', 'Bose', 'Chatterjee', 'Das', 'Desai', 'Gupta', 'Iyer',
      'Joshi', 'Kapoor', 'Kumar', 'Mehta', 'Nair', 'Patel', 'Rao', 'Reddy',
      'Sharma', 'Singh', 'Verma',
    ],
  },
  location: {
    cities: [
      'Ahmedabad', 'Bangalore', 'Chennai', 'Delhi', 'Hyderabad', 'Jaipur',
      'Kolkata', 'Lucknow', 'Mumbai', 'Pune', 'Surat',
    ],
    countries: [{ name: 'India', code: 'IN' }],
    streetSuffixes: ['Marg', 'Road', 'Nagar', 'Path', 'Chowk', 'Gali'],
    zipFormat: '######',
  },
};
