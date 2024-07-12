import { firstNames, jobTitles, lastNames } from '../data/en.js';
import { Module } from './base.js';

/** People: names and job titles. */
export class PersonModule extends Module {
  firstName(): string {
    return this.g.helpers.arrayElement(firstNames);
  }

  lastName(): string {
    return this.g.helpers.arrayElement(lastNames);
  }

  /** Full name, e.g. `"Priya Nakamura"`. */
  fullName(): string {
    return `${this.firstName()} ${this.lastName()}`;
  }

  jobTitle(): string {
    return this.g.helpers.arrayElement(jobTitles);
  }
}
