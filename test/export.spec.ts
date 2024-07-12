import { describe, expect, it } from 'vitest';
import { toCSV, toJSON, toSQL } from '../src/index.js';

const rows = [
  { id: 1, name: 'Alice', note: 'a, b "c"', when: new Date('2026-01-01T00:00:00Z'), active: true },
  { id: 2, name: 'Bob', note: 'line\nbreak', when: new Date('2026-02-01T00:00:00Z'), active: false },
];

describe('toJSON', () => {
  it('serializes dates as ISO strings', () => {
    const out = toJSON(rows);
    expect(out).toContain('"2026-01-01T00:00:00.000Z"');
    expect(JSON.parse(out)).toHaveLength(2);
  });

  it('supports compact mode', () => {
    expect(toJSON([{ a: 1 }], false)).toBe('[{"a":1}]');
  });
});

describe('toCSV', () => {
  it('emits a header and quotes fields with delimiters/quotes/newlines', () => {
    const out = toCSV(rows);
    const lines = out.split('\n');
    expect(lines[0]).toBe('id,name,note,when,active');
    expect(lines[1]).toContain('"a, b ""c"""'); // escaped comma + quotes
    expect(out).toContain('"line\nbreak"');
  });

  it('respects custom delimiter and column order', () => {
    const out = toCSV(rows, { delimiter: ';', columns: ['name', 'id'], header: true });
    expect(out.split('\n')[0]).toBe('name;id');
    expect(out.split('\n')[1]).toBe('Alice;1');
  });

  it('can omit the header', () => {
    const out = toCSV([{ a: 1, b: 2 }], { header: false });
    expect(out).toBe('1,2');
  });
});

describe('toSQL', () => {
  it('emits one INSERT per row with proper escaping', () => {
    const out = toSQL('users', rows);
    const statements = out.split(/;\n|;$/).filter(Boolean);
    expect(statements).toHaveLength(2);
    expect(out).toContain(
      `INSERT INTO "users" ("id", "name", "note", "when", "active") VALUES (1, 'Alice', 'a, b "c"', '2026-01-01T00:00:00.000Z', TRUE);`
    );
    // Embedded newlines are preserved verbatim inside the string literal.
    expect(out).toContain("'line\nbreak'");
    expect(out).toContain('FALSE');
  });

  it('escapes single quotes in string values', () => {
    const out = toSQL('t', [{ v: "O'Brien" }]);
    expect(out).toContain("'O''Brien'");
  });

  it('supports multi-row inserts and NULLs', () => {
    const out = toSQL('t', [{ a: 1, b: null }, { a: 2, b: 'x' }], { multiRow: true });
    expect(out).toContain('VALUES\n');
    expect(out).toContain('(1, NULL)');
    expect(out.match(/INSERT INTO/g)).toHaveLength(1);
  });

  it('rejects invalid table names and handles empty input', () => {
    expect(() => toSQL('bad name;', rows)).toThrow();
    expect(toSQL('t', [])).toBe('');
  });
});
