import { preferEffectAlchemyNamespaceImports } from '../../../src/rules/effect/prefer-effect-alchemy-namespace-imports';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-alchemy-namespace-imports', preferEffectAlchemyNamespaceImports, {
  valid: `
    import * as Arr from 'effect/Array'
    import * as Cloudflare from 'alchemy/Cloudflare'
    import { Url, Headers } from 'effect/unstable/http'
    import { describe, expect } from '@effect/vitest'
    import { deepStrictEqual } from '@effect/vitest/utils'
  `,
  invalid: `import { sort } from 'effect/Array'`,
  messageId: 'namespace',
});

testRule('prefer-effect-alchemy-namespace-imports', preferEffectAlchemyNamespaceImports, {
  valid: `import * as P from 'effect/Predicate'`,
  invalid: `import * as Predicate from 'effect/Predicate'`,
  messageId: 'alias',
});
