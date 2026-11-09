import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { preferEffectSse } from '../../../src/rules/effect/prefer-effect-sse';
import { testRule } from '../../rule-tester';

const ruleName = 'prefer-effect-sse';

const effect = `import * as Effect from 'effect/Effect';`;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

testRule(ruleName, preferEffectSse, {
  valid: `
    import * as Effect from 'effect/Effect'
    import { Sse } from 'effect/encoding'
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    import { createParser } from 'eventsource-parser'
  `,
  messageId: 'library',
  data: { source: 'eventsource-parser' },
});

tester.run(ruleName, preferEffectSse, {
  valid: [
    // Only files that use Effect are checked.
    `import { createParser } from 'eventsource-parser';`,
    'const events = new EventSource(url);',
    // Type-only imports pull in no runtime code.
    `${effect} import type { EventSourceMessage } from 'eventsource-parser';`,
    // Packages whose name only starts with an SSE package name.
    `${effect} import { emit } from 'eventsource-parser-extra';`,
    // A local EventSource is not the browser global.
    `${effect} class EventSource {} const events = new EventSource();`,
    `${effect} import { EventSource } from './event-source'; const events = new EventSource();`,
  ],
  invalid: [
    ...Arr.map(
      [
        [`${effect} import { EventSourceParserStream } from 'eventsource-parser/stream';`, 'eventsource-parser/stream'],
        [
          `${effect} import { fetchEventSource } from '@microsoft/fetch-event-source';`,
          '@microsoft/fetch-event-source',
        ],
        [`${effect} import { EventSource } from 'eventsource';`, 'eventsource'],
        [`${effect} const { createSession } = await import('better-sse');`, 'better-sse'],
      ] as const,
      ([code, source]) => ({ code, errors: [{ messageId: 'library', data: { source } }] }),
    ),
    { code: `${effect} const events = new EventSource('/events');`, errors: [{ messageId: 'eventSource' }] },
  ],
});
