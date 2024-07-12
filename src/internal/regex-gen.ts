import { TDGError } from '../errors.js';
import type { TestDataGenerator } from '../generator.js';

export interface FromRegexOptions {
  /** Cap for unbounded quantifiers (`*`, `+`, `{n,}`). Default 5. */
  maxRepetition?: number;
}

type Node =
  | { type: 'alt'; branches: Node[][] }
  | { type: 'repeat'; node: Node; min: number; max: number }
  | { type: 'chars'; chars: string }
  | { type: 'literal'; value: string }
  | { type: 'empty' };

const PRINTABLE = Array.from({ length: 95 }, (_, i) =>
  String.fromCharCode(32 + i)
).join('');
const DIGITS = '0123456789';
const WORD_CHARS =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
const SPACE_CHARS = ' \t';

function complement(chars: string): string {
  const excluded = new Set(chars);
  let result = '';
  for (const c of PRINTABLE) {
    if (!excluded.has(c)) result += c;
  }

  return result;
}

/**
 * Recursive-descent parser for the commonly-used subset of regex syntax:
 * literals, `.`, escapes (\d \D \w \W \s \S \n \t \r and escaped literals),
 * character classes (ranges, negation), groups (incl. non-capturing/named),
 * alternation, and quantifiers (* + ? {n} {n,} {n,m}, lazy variants).
 *
 * Unsupported (throws): lookahead/lookbehind, backreferences, \b.
 */
class RegexParser {
  private pos = 0;

  constructor(private readonly src: string) {}

  parse(): Node {
    const node = this.parseAlternation();
    if (this.pos < this.src.length) {
      throw new TDGError(
        `fromRegex: unexpected '${this.src[this.pos]}' at position ${this.pos} in /${this.src}/.`
      );
    }

    return node;
  }

  private peek(offset = 0): string | undefined {
    return this.src[this.pos + offset];
  }

  private next(): string {
    const c = this.src[this.pos++];
    if (c === undefined) {
      throw new TDGError(`fromRegex: unexpected end of pattern /${this.src}/.`);
    }

    return c;
  }

  private eof(): boolean {
    return this.pos >= this.src.length;
  }

  private parseAlternation(): Node {
    const branches: Node[][] = [this.parseSequence()];
    while (!this.eof() && this.peek() === '|') {
      this.next();
      branches.push(this.parseSequence());
    }

    return { type: 'alt', branches };
  }

  private parseSequence(): Node[] {
    const nodes: Node[] = [];
    while (!this.eof() && this.peek() !== '|' && this.peek() !== ')') {
      nodes.push(this.parseTerm());
    }

    return nodes;
  }

  private parseTerm(): Node {
    const atom = this.parseAtom();
    const c = this.peek();

    let min: number | undefined;
    let max: number | undefined;
    if (c === '*') {
      [min, max] = [0, Infinity];
      this.next();
    } else if (c === '+') {
      [min, max] = [1, Infinity];
      this.next();
    } else if (c === '?') {
      [min, max] = [0, 1];
      this.next();
    } else if (c === '{') {
      const parsed = this.tryParseBraceQuantifier();
      if (parsed) [min, max] = parsed;
    }

    if (min === undefined || max === undefined) {
      return atom;
    }

    // Consume a lazy/possessive modifier — irrelevant for generation.
    if (this.peek() === '?' || this.peek() === '+') this.next();
    return { type: 'repeat', node: atom, min, max };
  }

  /** Parses `{n}`, `{n,}`, `{n,m}`. Returns undefined (no consumption) if malformed — JS treats a malformed brace as a literal `{`. */
  private tryParseBraceQuantifier(): [number, number] | undefined {
    const start = this.pos;
    this.next(); // '{'
    let minDigits = '';
    while (!this.eof() && /\d/.test(this.peek() as string)) minDigits += this.next();
    if (minDigits === '') {
      this.pos = start;
      return undefined;
    }

    const min = Number(minDigits);
    if (this.peek() === '}') {
      this.next();
      return [min, min];
    }

    if (this.peek() !== ',') {
      this.pos = start;
      return undefined;
    }

    this.next(); // ','
    let maxDigits = '';
    while (!this.eof() && /\d/.test(this.peek() as string)) maxDigits += this.next();
    if (this.peek() !== '}') {
      this.pos = start;
      return undefined;
    }

    this.next(); // '}'
    return [min, maxDigits === '' ? Infinity : Number(maxDigits)];
  }

  private parseAtom(): Node {
    const c = this.next();
    switch (c) {
      case '(': {
        if (this.peek() === '?') {
          this.next();
          const kind = this.peek();
          if (kind === ':') {
            this.next();
          } else if (kind === '=' || kind === '!') {
            throw new TDGError('fromRegex: lookahead is not supported.');
          } else if (kind === '<') {
            this.next();
            if (this.peek() === '=' || this.peek() === '!') {
              throw new TDGError('fromRegex: lookbehind is not supported.');
            }

            // Named group `(?<name>` — skip the name.
            while (this.next() !== '>') {
              // consume
            }
          } else {
            throw new TDGError(`fromRegex: unsupported group '(?${kind ?? ''}'.`);
          }
        }

        const inner = this.parseAlternation();
        if (this.eof() || this.next() !== ')') {
          throw new TDGError(`fromRegex: unbalanced parentheses in /${this.src}/.`);
        }

        return inner;
      }
      case '[':
        return this.parseCharClass();
      case '\\':
        return this.parseEscape(this.next());
      case '.':
        return { type: 'chars', chars: PRINTABLE };
      case '^':
      case '$':
        return { type: 'empty' };
      default:
        return { type: 'literal', value: c };
    }
  }

  private parseEscape(c: string): Node {
    switch (c) {
      case 'd':
        return { type: 'chars', chars: DIGITS };
      case 'D':
        return { type: 'chars', chars: complement(DIGITS) };
      case 'w':
        return { type: 'chars', chars: WORD_CHARS };
      case 'W':
        return { type: 'chars', chars: complement(WORD_CHARS) };
      case 's':
        return { type: 'chars', chars: SPACE_CHARS };
      case 'S':
        return { type: 'chars', chars: complement(SPACE_CHARS) };
      case 'n':
        return { type: 'literal', value: '\n' };
      case 't':
        return { type: 'literal', value: '\t' };
      case 'r':
        return { type: 'literal', value: '\r' };
      case 'b':
      case 'B':
        throw new TDGError('fromRegex: word boundaries (\\b) are not supported.');
      default:
        if (/\d/.test(c)) {
          throw new TDGError('fromRegex: backreferences are not supported.');
        }

        return { type: 'literal', value: c };
    }
  }

  private parseCharClass(): Node {
    let negated = false;
    if (this.peek() === '^') {
      negated = true;
      this.next();
    }

    let chars = '';
    while (!this.eof() && this.peek() !== ']') {
      let start: string;
      const c = this.next();
      if (c === '\\') {
        const escaped = this.parseEscape(this.next());
        if (escaped.type === 'chars') {
          chars += escaped.chars;
          continue;
        }

        start = (escaped as { value: string }).value;
      } else {
        start = c;
      }

      // Range like a-z (but `-` before `]` is a literal).
      if (this.peek() === '-' && this.peek(1) !== ']' && this.peek(1) !== undefined) {
        this.next(); // '-'
        let end = this.next();
        if (end === '\\') {
          const escaped = this.parseEscape(this.next());
          if (escaped.type === 'chars') {
            throw new TDGError('fromRegex: invalid character-class range.');
          }

          end = (escaped as { value: string }).value;
        }

        if (start.charCodeAt(0) > end.charCodeAt(0)) {
          throw new TDGError(`fromRegex: invalid range ${start}-${end}.`);
        }

        for (let code = start.charCodeAt(0); code <= end.charCodeAt(0); code++) {
          chars += String.fromCharCode(code);
        }
      } else {
        chars += start;
      }
    }

    if (this.eof()) {
      throw new TDGError(`fromRegex: unterminated character class in /${this.src}/.`);
    }

    this.next(); // ']'
    if (negated) chars = complement(chars);
    const unique = [...new Set(chars)].join('');
    if (unique === '') {
      throw new TDGError('fromRegex: character class matches nothing.');
    }

    return { type: 'chars', chars: unique };
  }
}

function generateNode(node: Node, g: TestDataGenerator, maxRep: number): string {
  switch (node.type) {
    case 'alt': {
      const branch = g.helpers.arrayElement(node.branches);
      return branch.map((n) => generateNode(n, g, maxRep)).join('');
    }
    case 'repeat': {
      const max = node.max === Infinity ? node.min + maxRep : node.max;
      const count = g.number.int({ min: node.min, max });
      let out = '';
      for (let i = 0; i < count; i++) {
        out += generateNode(node.node, g, maxRep);
      }

      return out;
    }
    case 'chars':
      return g.string.fromCharacters(node.chars, 1);
    case 'literal':
      return node.value;
    case 'empty':
      return '';
  }
}

export function generateFromRegex(
  g: TestDataGenerator,
  pattern: RegExp | string,
  options: FromRegexOptions = {}
): string {
  const source = typeof pattern === 'string' ? pattern : pattern.source;
  const { maxRepetition = 5 } = options;

  const ast = new RegexParser(source).parse();
  const result = generateNode(ast, g, maxRepetition);

  // Self-check against the real regex engine — catches any construct the
  // generator mis-handles instead of silently returning a non-matching value.
  const flags =
    typeof pattern === 'string' ? '' : pattern.flags.replace(/[gy]/g, '');
  if (!new RegExp(source, flags).test(result)) {
    throw new TDGError(
      `fromRegex: generated value ${JSON.stringify(result)} does not match /${source}/. This pattern uses a construct the generator does not fully support.`
    );
  }

  return result;
}
