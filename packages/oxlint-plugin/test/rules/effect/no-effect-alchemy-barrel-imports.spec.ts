import { noEffectAlchemyBarrelImports } from '../../../src/rules/effect/no-effect-alchemy-barrel-imports';
import { testRule } from '../../rule-tester';

testRule('no-effect-alchemy-barrel-imports', noEffectAlchemyBarrelImports, {
  valid: `
    import * as Arr from 'effect/Array'
    import { pipe, type Effect } from 'effect'
    import { describe, layer } from '@effect/vitest'
    import * as Alchemy from 'alchemy'
  `,
  invalid: `import { Array as Arr } from 'effect'`,
  messageId: 'barrelImport',
});

testRule('no-effect-alchemy-barrel-imports', noEffectAlchemyBarrelImports, {
  valid: `import * as Cloudflare from 'alchemy/Cloudflare'`,
  invalid: `import { Cloudflare } from 'alchemy'`,
  messageId: 'barrelImport',
});
