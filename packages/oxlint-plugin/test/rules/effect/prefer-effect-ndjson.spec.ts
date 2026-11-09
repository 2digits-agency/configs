import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectNdjson } from '../../../src/rules/effect/prefer-effect-ndjson';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const imports = `
  import * as Arr from 'effect/Array'
  import * as Effect from 'effect/Effect'
  import * as Fn from 'effect/Function'
  import * as Str from 'effect/String'
`;

function invalid(code: string, messageId: 'decode' | 'encode') {
  return { code: `${imports}\n${code}`, errors: [{ messageId }] };
}

tester.run('prefer-effect-ndjson', preferEffectNdjson, {
  valid: [
    // Not an Effect file.
    String.raw`const values = text.split('\n').map((line) => JSON.parse(line))`,
    `${imports}
      const value = JSON.parse(body)
      const parsed = Arr.map(bodies, (body) => JSON.parse(body))
      const words = text.split(' ').map((word) => JSON.parse(word))
      const nested = text.split('\\n').map((line) => items.map((item) => JSON.parse(item)))
      const message = Arr.join([first.logsText, second.logsText], '\\n')
      const headers = Arr.join(Arr.map(entries, ([name, value]) => \`\${name}: \${value}\`), '\\n')
      const csv = rows.map((row) => JSON.stringify(row)).join(',')
      const counts = files.map((file) => file.split('\\n').length).map((count) => JSON.parse(count))
      const groups = batches.map((batch) => batch.map(JSON.stringify).join(',')).join('\\n')
      const sse = values.map(JSON.stringify).map((json) => \`data: \${json}\`).join('\\n')
      const events = Arr.join(Arr.map(Arr.map(values, JSON.stringify), (json) => \`data: \${json}\\n\`), '\\n')
      const data = text.split('\\n').map((line) => line.slice(6)).map((payload) => JSON.parse(payload))
      const total = Str.split(text, '\\n').reduce((count, line) => count + JSON.parse(line), 0)
    `,
    `${imports}
      const JSON = { parse: (line) => line }
      const values = text.split('\\n').map((line) => JSON.parse(line))
    `,
    `${imports}
      for (const line of Str.split(note, /\\r?\\n/)) {
        const match = pattern.exec(line)
      }
    `,
  ],
  invalid: [
    invalid(
      String.raw`const values = text.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => JSON.parse(line))`,
      'decode',
    ),
    invalid(String.raw`const body = values.map(JSON.stringify).filter(Boolean).join('\n')`, 'encode'),
    invalid(String.raw`const values = text.split('\n').map((line) => JSON.parse(line))`, 'decode'),
    invalid(String.raw`const values = text.split(/\r?\n/).filter(Boolean).map(JSON.parse)`, 'decode'),
    invalid(String.raw`const values = Arr.map(Str.split(text, '\n'), (line) => JSON.parse(line.trim()))`, 'decode'),
    invalid(
      String.raw`const values = Fn.pipe(text, Str.split('\n'), Arr.filter(Str.isNonEmpty), Arr.map(JSON.parse))`,
      'decode',
    ),
    invalid(
      "const lines = Str.split(text, '\\r\\n')\nconst values = Effect.forEach(lines, (line) => Effect.try(() => JSON.parse(line)))",
      'decode',
    ),
    invalid("for (const line of body.split('\\n')) {\n  events.push(JSON.parse(line))\n}", 'decode'),
    invalid(String.raw`const body = values.map((value) => JSON.stringify(value)).join('\n')`, 'encode'),
    invalid(String.raw`const body = Arr.join(Arr.map(values, JSON.stringify), '\n')`, 'encode'),
    invalid(String.raw`const body = values.pipe(Arr.map((value) => JSON.stringify(value)), Arr.join('\n'))`, 'encode'),
    invalid(
      "const lines = values.map((value) => {\n  return JSON.stringify(value)\n})\nconst body = lines.join('\\n')",
      'encode',
    ),
  ],
});
