import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { rules } from '../../src';

RuleTester.describe = describe;

RuleTester.it = it;

new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } }).run('no-non-ascii', rules['no-non-ascii'], {
  valid: [
    "// Plain ASCII\r\nconst text = 'a -> b';",
    String.raw`const caf\u00E9 = '\u{1F680}';`,
    '<button aria-label="Next">Next &rarr;</button>;',
  ],
  invalid: [
    {
      code: "// Wait…\r\nconst café = '🚀→';",
      errors: [
        { messageId: 'nonAscii', data: { codePoint: '2026' }, line: 1, column: 8, endColumn: 9 },
        { messageId: 'nonAscii', data: { codePoint: '00E9' }, line: 2, column: 10, endColumn: 11 },
        { messageId: 'nonAscii', data: { codePoint: '1F680' }, line: 2, column: 15, endColumn: 17 },
        { messageId: 'nonAscii', data: { codePoint: '2192' }, line: 2, column: 17, endColumn: 18 },
      ],
      output: null,
    },
    {
      code: 'const\u00A0value = 1;',
      errors: [{ messageId: 'nonAscii', data: { codePoint: '00A0' }, line: 1, column: 6, endColumn: 7 }],
    },
    {
      code: '<button aria-label="Café">Next →</button>;',
      errors: [
        { messageId: 'nonAscii', data: { codePoint: '00E9' }, line: 1, column: 24, endColumn: 25 },
        { messageId: 'nonAscii', data: { codePoint: '2192' }, line: 1, column: 32, endColumn: 33 },
      ],
      output: null,
    },
  ],
});
