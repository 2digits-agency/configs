import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { noManualSse } from '../../../src/rules/effect/no-manual-sse';
import { testRule } from '../../rule-tester';

const ruleName = 'no-manual-sse';

const effect = `import * as Effect from 'effect/Effect';`;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

testRule(ruleName, noManualSse, {
  valid: `
    import { Sse } from 'effect/encoding'
    const frame = Sse.encoder.write({ _tag: 'Event', event: 'message', id: undefined, data })
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    const frame = \`data: \${JSON.stringify(payload)}\\n\\n\`
  `,
  messageId: 'frame',
});

tester.run(ruleName, noManualSse, {
  valid: [
    // Only files that use Effect are checked.
    `const frame = \`data: \${JSON.stringify(payload)}\\n\\n\`;`,
    // A heartbeat comment has no field, and Sse.encoder cannot write comments.
    `${effect} const ping = ': ping\\n\\n';`,
    // A field without the blank line that dispatches it is not a frame.
    `${effect} const line = 'data: ' + json;`,
    `${effect} const summary = \`id: \${id}\\nname: \${name}\`;`,
    // A field name inside a line is not a field.
    `${effect} const text = \`metadata: \${value}\\n\\n\`;`,
    // \`data:\` without a space also starts data URLs.
    `${effect} const inline = src.startsWith('data:');`,
    `${effect} const image = /^data:image\\//.test(src);`,
    // Labels in log messages are not parsing.
    `${effect} const log = Effect.log('data: ', payload);`,
    `${effect} const other = line.endsWith('data: ');`,
  ],
  invalid: [
    ...Arr.map(
      [
        `${effect} const done = 'data: [DONE]\\n\\n';`,
        `${effect} const frame = \`event: \${name}\\ndata: \${body}\\n\\n\`;`,
        `${effect} const frame = \`id: \${id}\\r\\ndata: \${body}\\r\\n\\r\\n\`;`,
        `${effect} const retry = 'retry: 3000\\n\\n';`,
        // A concatenated frame is reported once, as a whole.
        `${effect} const frame = 'event: ' + name + '\\n' + \`data: \${body}\` + '\\n\\n';`,
        `${effect} writer.write(encoder.encode(\`data: \${JSON.stringify(event)}\\n\\n\`));`,
      ],
      (code) => ({ code, errors: [{ messageId: 'frame' }] }),
    ),
    ...Arr.map(
      [
        [`${effect} if (line.startsWith('data: ')) handle(line.slice(6));`, 'data: '],
        [`${effect} const named = lines[i]?.startsWith('event: ');`, 'event: '],
        [`import * as Str from 'effect/String'; const data = lines.filter(Str.startsWith('data: '));`, 'data: '],
      ] as const,
      ([code, prefix]) => ({ code, errors: [{ messageId: 'parse', data: { prefix } }] }),
    ),
  ],
});
