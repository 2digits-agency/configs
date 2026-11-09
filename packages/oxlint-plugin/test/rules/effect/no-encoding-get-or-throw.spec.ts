import { RuleTester } from 'oxlint/plugins-dev';

import { noEncodingGetOrThrow } from '../../../src/rules/effect/no-encoding-get-or-throw';
import { testRule } from '../../rule-tester';

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

testRule('no-encoding-get-or-throw', noEncodingGetOrThrow, {
  valid: `
    import * as Effect from 'effect/Effect'
    import { Base64 } from 'effect/encoding'
    const bytes = Effect.fromResult(Base64.decode(token))
  `,
  invalid: `
    import * as Result from 'effect/Result'
    import { Base64 } from 'effect/encoding'
    const text = Result.getOrThrow(Base64.decodeString(token))
  `,
  messageId: 'getOrThrow',
  data: { method: 'getOrThrow', decoder: 'Base64.decodeString' },
});

const imports = `import * as Result from 'effect/Result'; import { pipe } from 'effect/Function'; import { Base64Url, Hex } from 'effect/encoding';`;

tester.run('no-encoding-get-or-throw forms', noEncodingGetOrThrow, {
  valid: [
    `${imports} Result.getOrThrow(Url.fromString(href)); Result.getOrElse(Hex.decode(digest), () => empty);`,
    `${imports} Hex.encode(bytes).pipe(Result.getOrThrow); pipe(Base64Url.decode(token), Result.match(handlers));`,
    `import * as Result from 'effect/Result'; const Hex = { decode }; Result.getOrThrow(Hex.decode(digest));`,
  ],
  invalid: [
    {
      code: `${imports} Base64Url.decode(token).pipe(Result.getOrThrowWith(() => new Error('bad token')));`,
      errors: [{ messageId: 'getOrThrow', data: { method: 'getOrThrowWith', decoder: 'Base64Url.decode' } }],
    },
    {
      code: `${imports} pipe(Hex.decode(digest), Result.getOrThrow);`,
      errors: [{ messageId: 'getOrThrow', data: { method: 'getOrThrow', decoder: 'Hex.decode' } }],
    },
    {
      code: `import * as Result from 'effect/Result'; import * as Encoding from 'effect/encoding'; Result.getOrThrow(Encoding.Hex.decode(digest));`,
      errors: [{ messageId: 'getOrThrow', data: { method: 'getOrThrow', decoder: 'Hex.decode' } }],
    },
    {
      code: `import * as Result from 'effect/Result'; import * as Base64 from 'effect/encoding/Base64'; Result.getOrThrow(Base64.decode(token));`,
      errors: [{ messageId: 'getOrThrow', data: { method: 'getOrThrow', decoder: 'Base64.decode' } }],
    },
  ],
});
