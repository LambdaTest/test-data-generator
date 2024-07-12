import { Module } from './base.js';

/** People: names and job titles. Names come from the active locale. */
export class PersonModule extends Module {
  firstName(): string {
    return this.g.helpers.arrayElement(
      this.g.localeEntry<string>('person', 'firstNames')
    );
  }

  lastName(): string {
    return this.g.helpers.arrayElement(
      this.g.localeEntry<string>('person', 'lastNames')
    );
  }

  /** Full name, e.g. `"Priya Nakamura"`. */
  fullName(): string {
    return `${this.firstName()} ${this.lastName()}`;
  }

  jobTitle(): string {
    return this.g.helpers.arrayElement(
      this.g.localeEntry<string>('person', 'jobTitles')
    );
  }
}
