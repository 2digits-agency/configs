import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { rules } from '../../src';

RuleTester.describe = describe;

RuleTester.it = it;

new RuleTester({ languageOptions: { parserOptions: { lang: 'tsx' } } }).run('no-non-ascii', rules['no-non-ascii'], {
  valid: [
    "// Plain ASCII symbols\r\nconst text = `a -> b` + '1 < 2 | ~3 ^ $4';",
    "const text = 'Café “De Grens” – € 12,50 © 2026, 20°C';",
    'const\u{A0}value = 1;',
    String.raw`const label = '\u{1F680} \u2192';`,
    '<button aria-label="Volgende café">Next &rarr;</button>;',
    "const range = '月曜〰金曜';",
  ],
  invalid: [
    {
      code: "// Wait…\r\nconst café = '🚀→';",
      errors: [
        { messageId: 'glyph', data: { codePoint: '2026' }, line: 1, column: 7, endColumn: 8 },
        { messageId: 'glyph', data: { codePoint: '1F680' }, line: 2, column: 14, endColumn: 16 },
        { messageId: 'glyph', data: { codePoint: '2192' }, line: 2, column: 16, endColumn: 17 },
      ],
    },
    {
      code: "const meta = [city, category].join(' · ');",
      errors: [{ messageId: 'glyph', data: { codePoint: '00B7' }, line: 1, column: 37, endColumn: 38 }],
    },
    {
      // A family emoji is one glyph of three people joined by zero-width joiners.
      code: "const label = '👨\u{200D}👩\u{200D}👧 ×';",
      errors: [
        { messageId: 'glyph', data: { codePoint: '1F468' }, line: 1, column: 15, endColumn: 23 },
        { messageId: 'glyph', data: { codePoint: '00D7' }, line: 1, column: 24, endColumn: 25 },
      ],
    },
    {
      // A keycap starts with an ASCII digit; a variation selector turns the wavy dash into its emoji form.
      code: "const step = '1\u{FE0F}\u{20E3}';\nconst wave = '〰\u{FE0F}';",
      errors: [
        { messageId: 'glyph', data: { codePoint: '0031' }, line: 1, column: 14, endColumn: 17 },
        { messageId: 'glyph', data: { codePoint: '3030' }, line: 2, column: 14, endColumn: 16 },
      ],
    },
    {
      code: '<button aria-label="Café">Next →</button>;',
      errors: [{ messageId: 'glyph', data: { codePoint: '2192' }, line: 1, column: 31, endColumn: 32 }],
    },
  ],
});
