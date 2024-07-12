import { describe, expect, it } from 'vitest';
import { runCli } from '../src/index.js';

describe('CLI', () => {
  it('generates JSON by default', () => {
    const { output, exitCode } = runCli(['users', '--count', '3', '--seed', '42']);
    expect(exitCode).toBe(0);
    const rows = JSON.parse(output);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveProperty('email');
  });

  it('is deterministic for a given seed', () => {
    const a = runCli(['users', '-c', '5', '-s', 'abc']);
    const b = runCli(['users', '-c', '5', '-s', 'abc']);
    expect(a.output).toBe(b.output);
  });

  it('supports csv format', () => {
    const { output } = runCli(['users', '-c', '2', '-s', '1', '-f', 'csv']);
    const lines = output.split('\n');
    expect(lines[0]).toContain('id,firstName');
    expect(lines).toHaveLength(3); // header + 2 rows
  });

  it('supports sql format with a custom table', () => {
    const { output } = runCli(['transactions', '-c', '2', '-s', '1', '-f', 'sql', '-t', 'payments']);
    expect(output).toContain('INSERT INTO "payments"');
  });

  it('respects locale', () => {
    const { output } = runCli(['users', '-c', '10', '-s', '1', '-l', 'de']);
    const rows = JSON.parse(output);
    const deFirstNames = new Set(['Alexander', 'Anna', 'Ben', 'Clara', 'Emma', 'Felix', 'Lukas', 'Max', 'Mia', 'Paul', 'Tom', 'Leon', 'Noah', 'Finn', 'Jonas', 'Tim', 'Lena', 'Marie', 'Sophie', 'Laura', 'Hannah', 'Julia', 'Sarah', 'Emilia', 'Elias', 'David', 'Niklas', 'Paul']);
    expect(deFirstNames.has(rows[0].firstName)).toBe(true);
  });

  it('shows help and version', () => {
    expect(runCli(['--help']).output).toContain('Usage:');
    expect(runCli(['--version']).exitCode).toBe(0);
  });

  it('errors on unknown schema, format, and options', () => {
    expect(runCli(['widgets']).exitCode).toBe(1);
    expect(runCli(['users', '-f', 'xml']).exitCode).toBe(1);
    expect(runCli(['users', '--bogus']).exitCode).toBe(1);
    expect(runCli([]).exitCode).toBe(1);
  });
});
