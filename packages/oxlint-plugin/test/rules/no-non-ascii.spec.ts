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
        { messageId: 'nonAscii', data: { codePoint: '2026' }, line: 1, column: 7, endColumn: 8 },
        { messageId: 'nonAscii', data: { codePoint: '00E9' }, line: 2, column: 9, endColumn: 10 },
        { messageId: 'nonAscii', data: { codePoint: '1F680' }, line: 2, column: 14, endColumn: 16 },
        { messageId: 'nonAscii', data: { codePoint: '2192' }, line: 2, column: 16, endColumn: 17 },
      ],
    },
    {
      code: 'const\u{A0}value = 1;',
      errors: [{ messageId: 'nonAscii', data: { codePoint: '00A0' }, line: 1, column: 5, endColumn: 6 }],
    },
    {
      code: '<button aria-label="Café">Next →</button>;',
      errors: [
        { messageId: 'nonAscii', data: { codePoint: '00E9' }, line: 1, column: 23, endColumn: 24 },
        { messageId: 'nonAscii', data: { codePoint: '2192' }, line: 1, column: 31, endColumn: 32 },
      ],
    },
  ],
});
