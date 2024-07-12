import { Module } from './base.js';
import type { BoundaryCase } from './boundary.js';

/**
 * Known-malicious input payloads for negative / input-validation testing.
 * Every payload is flagged `valid: false` — your input handling should
 * reject or safely neutralize all of them. Feed straight into `test.each`.
 *
 * These are static, well-known strings for testing your OWN sanitization;
 * they are not exploits against third parties.
 */
export class SecurityModule extends Module {
  /** Cross-site-scripting payloads. */
  xss(): BoundaryCase<string>[] {
    return this.label([
      ['<script>alert(1)</script>', 'basic script tag'],
      ['<img src=x onerror=alert(1)>', 'img onerror handler'],
      ['"><svg/onload=alert(1)>', 'attribute breakout + svg onload'],
      ["javascript:alert(document.cookie)", 'javascript: URI'],
      ['<a href="javascript:alert(1)">x</a>', 'anchor javascript href'],
      ['<body onload=alert(1)>', 'body onload handler'],
      ['{{constructor.constructor("alert(1)")()}}', 'template-injection payload'],
      ['<iframe src="data:text/html,<script>alert(1)</script>">', 'data-URI iframe'],
      ['<input autofocus onfocus=alert(1)>', 'autofocus onfocus'],
      ['&#60;script&#62;alert(1)&#60;/script&#62;', 'html-entity encoded script'],
    ]);
  }

  /** SQL-injection payloads. */
  sqlInjection(): BoundaryCase<string>[] {
    return this.label([
      ["' OR '1'='1", 'classic tautology'],
      ["' OR 1=1--", 'comment-terminated tautology'],
      ["'; DROP TABLE users;--", 'stacked drop-table'],
      ["admin'--", 'comment-out password check'],
      ["' UNION SELECT username, password FROM users--", 'union-based extraction'],
      ["1; WAITFOR DELAY '0:0:5'--", 'time-based blind (mssql)'],
      ["' OR SLEEP(5)--", 'time-based blind (mysql)'],
      ["\" OR \"\"=\"", 'double-quote tautology'],
      ["') OR ('1'='1", 'parenthesis breakout'],
      ["0x27 OR 1=1", 'hex-encoded quote'],
    ]);
  }

  /** Command-injection payloads. */
  commandInjection(): BoundaryCase<string>[] {
    return this.label([
      ['; ls -la', 'semicolon chain'],
      ['| cat /etc/passwd', 'pipe to cat'],
      ['`whoami`', 'backtick substitution'],
      ['$(id)', 'dollar-paren substitution'],
      ['&& rm -rf /', 'and-chain destructive'],
      ['|| ping -c 10 127.0.0.1', 'or-chain'],
      ['\n/bin/sh\n', 'newline-injected shell'],
    ]);
  }

  /** Path-traversal payloads. */
  pathTraversal(): BoundaryCase<string>[] {
    return this.label([
      ['../../../../etc/passwd', 'unix traversal'],
      ['..\\..\\..\\windows\\win.ini', 'windows traversal'],
      ['%2e%2e%2f%2e%2e%2fetc%2fpasswd', 'url-encoded traversal'],
      ['....//....//etc/passwd', 'doubled-dot filter bypass'],
      ['/var/www/../../etc/shadow', 'absolute-path traversal'],
      ['file:///etc/passwd', 'file URI'],
    ]);
  }

  /**
   * A combined pool across all categories — a quick "throw everything at it"
   * set for a single input field.
   */
  all(): BoundaryCase<string>[] {
    return [
      ...this.xss(),
      ...this.sqlInjection(),
      ...this.commandInjection(),
      ...this.pathTraversal(),
    ];
  }

  private label(pairs: Array<[string, string]>): BoundaryCase<string>[] {
    return pairs.map(([value, label]) => ({ value, label, valid: false }));
  }
}
