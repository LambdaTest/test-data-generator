import type { TestDataGenerator } from '../generator.js';

/**
 * Base class for all modules. Holds a back-reference to the generator so
 * modules can reach the randomizer and each other, and binds all methods to
 * the instance so they can be destructured (`const { int } = tdg.number`).
 */
export abstract class Module {
  constructor(protected readonly g: TestDataGenerator) {
    let proto = Object.getPrototypeOf(this) as object;
    while (proto !== Object.prototype && proto !== null) {
      for (const name of Object.getOwnPropertyNames(proto)) {
        const value = (this as Record<string, unknown>)[name];
        if (name !== 'constructor' && typeof value === 'function') {
          (this as Record<string, unknown>)[name] = value.bind(this);
        }
      }
      proto = Object.getPrototypeOf(proto) as object;
    }
  }
}
