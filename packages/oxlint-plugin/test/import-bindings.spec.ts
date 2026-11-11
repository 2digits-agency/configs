import * as Arr from 'effect/Array';
import * as Str from 'effect/String';

import { rules, type RuleName } from '../src';
import { createRuleTester, testRule } from './rule-tester';

// Exercise the public rules, not the import collector's representation.
for (const [name, messageId, member, expression] of [
  ['no-empty-schema-struct', 'emptyStruct', 'Struct', 'API.Struct({})'],
  ['no-async-effect-try', 'asyncTry', 'try', 'API.try(async () => 1)'],
  ['no-zero-retry-times', 'zeroTimes', 'retry', 'API.retry(task, { times: 0 })'],
] satisfies ReadonlyArray<readonly [RuleName, string, string, string]>) {
  const module = name === 'no-empty-schema-struct' ? 'Schema' : 'Effect';

  const call = Str.replace(`API.${member}`, 'run')(expression);

  for (const valid of [
    `import * as API from 'effect/${module}'; function f(API) { ${expression} }`,
    `import { ${module} as API } from 'effect'; { const API = other; ${expression} }`,
    `import { ${member} as run } from 'effect/${module}'; function f(run) { ${call} }`,
    `import type * as API from 'effect/${module}'; ${expression}`,
    `import { type ${module} as API } from 'effect'; ${expression}`,
    `import { type ${member} as run } from 'effect/${module}'; ${call}`,
  ]) {
    testRule(name, rules[name], {
      valid,
      invalid: `import * as API from 'effect/${module}'; ${expression}`,
      messageId,
    });
  }
}

// The same imported name remains usable outside the shadowing scope.
// Named, barrel, namespace, string-literal and static computed imports stay supported.
createRuleTester().run('no-async-effect-try import forms', rules['no-async-effect-try'], {
  valid: [],
  invalid: Arr.map(
    [
      `import * as Fx from 'effect/Effect'; function f(Fx) { Fx.try(async () => 1) } Fx.try(async () => 1)`,
      `import { Effect as Fx } from 'effect'; Fx['try'](async () => 1)`,
      `import { try as attempt } from 'effect/Effect'; attempt(async () => 1)`,
      `import { 'try' as attempt } from 'effect/Effect'; attempt(async () => 1)`,
      `import * as Fx from 'effect'; Fx.Effect.try(async () => 1)`,
    ],
    (code) => ({ code, errors: [{ messageId: 'asyncTry' }] }),
  ),
});

createRuleTester().run('empty callback import scopes', rules['no-empty-effect-callback'], {
  valid: [
    `import * as Effect from 'effect/Effect'; function f(Effect) { Effect.callback(() => {}) }`,
    `import type * as Effect from 'effect/Effect'; Effect.callback(() => {})`,
  ],
  invalid: [],
});

createRuleTester().run('alchemy import scopes', rules['alchemy-no-v1-worker-properties'], {
  valid: [
    `import * as CF from 'alchemy/Cloudflare'; function f(CF) { CF.Worker('w', { entrypoint }) }`,
    `import type * as CF from 'alchemy/Cloudflare'; CF.Worker('w', { entrypoint })`,
  ],
  invalid: [],
});

// A type-only Effect import still marks an Effect file for syntax policies.
testRule('prefer-effect-filesystem', rules['prefer-effect-filesystem'], {
  valid: `import type * as Fx from 'effect/Effect'; import * as fs from 'other';`,
  invalid: `import type * as Fx from 'effect/Effect'; import * as fs from 'node:fs';`,
  messageId: 'effectFileSystem',
});
