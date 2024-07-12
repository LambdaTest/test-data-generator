import { loremWords } from '../data/en.js';
import { Module } from './base.js';

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/** Placeholder text. */
export class LoremModule extends Module {
  word(): string {
    return this.g.helpers.arrayElement(loremWords);
  }

  /** Space-separated words. */
  words(count = 3): string {
    return this.g.helpers.multiple(() => this.word(), { count }).join(' ');
  }

  /** Sentence of 3–10 words (or an exact word count). */
  sentence(wordCount?: number): string {
    const count = wordCount ?? this.g.number.int({ min: 3, max: 10 });
    return `${capitalize(this.words(count))}.`;
  }

  sentences(count = 3): string {
    return this.g.helpers.multiple(() => this.sentence(), { count }).join(' ');
  }

  /** Paragraph of 3–6 sentences. */
  paragraph(): string {
    return this.sentences(this.g.number.int({ min: 3, max: 6 }));
  }

  /** Slug of hyphen-joined words, e.g. `"dolorem-ipsum-quia"`. */
  slug(wordCount = 3): string {
    return this.g.helpers
      .multiple(() => this.word(), { count: wordCount })
      .join('-');
  }
}
