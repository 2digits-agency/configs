import { noEffectAlchemyBarrelImports } from '../../../src/rules/effect/no-effect-alchemy-barrel-imports';
import { testRule } from '../../rule-tester';

testRule('no-effect-alchemy-barrel-imports', noEffectAlchemyBarrelImports, {
  valid: `
    import * as Arr from 'effect/Array'
    import { pipe, type Effect } from 'effect'
    import { describe, layer } from '@effect/vitest'
    import * as Alchemy from 'alchemy'
    import { ALCHEMY_DEV, RuntimeContext } from 'alchemy'
    import * as E from 'effect/Effect'
    export const runtimeContext = RuntimeContext
    export const isDevelopment = E.gen(function* () {
      return yield* ALCHEMY_DEV
    })
  `,
  invalid: `import { Array as Arr } from 'effect'`,
  output: `import * as Arr from 'effect/Array';`,
  messageId: 'barrelImport',
});

testRule('no-effect-alchemy-barrel-imports', noEffectAlchemyBarrelImports, {
  valid: `import * as Cloudflare from 'alchemy/Cloudflare'`,
  invalid: `import { Cloudflare } from 'alchemy'`,
  output: `import * as Cloudflare from 'alchemy/Cloudflare';`,
  messageId: 'barrelImport',
});

testRule('no-effect-alchemy-barrel-imports', noEffectAlchemyBarrelImports, {
  valid: `
    import { ALCHEMY_PHASE, RuntimeContext as RC, Stack, Platform, Action, Cli, UnknownModule } from 'alchemy'
    import { Serverless } from 'alchemy'
    import type { AdoptPolicy } from 'alchemy'
    import { type Cloudflare } from 'alchemy'
  `,
  invalid: `import { AdoptPolicy as Policy } from 'alchemy'; Policy.adopt(true)`,
  output: `import * as Policy from 'alchemy/AdoptPolicy'; Policy.adopt(true)`,
  messageId: 'barrelImport',
});

testRule('no-effect-alchemy-barrel-imports', noEffectAlchemyBarrelImports, {
  valid: `import { ALCHEMY_DEV as dev, RuntimeContext as RC, FutureNamespace } from 'alchemy'; use(dev, RC)`,
  invalid: `import { ALCHEMY_DEV as dev, RuntimeContext as RC, Cloudflare as CF, type Stack, FutureNamespace, Serverless } from 'alchemy'; use(dev, RC, CF.Worker, Serverless)`,
  output: `import { ALCHEMY_DEV as dev, RuntimeContext as RC, type Stack, FutureNamespace, Serverless } from 'alchemy';\nimport * as CF from 'alchemy/Cloudflare'; use(dev, RC, CF.Worker, Serverless)`,
  messageId: 'barrelImport',
});
