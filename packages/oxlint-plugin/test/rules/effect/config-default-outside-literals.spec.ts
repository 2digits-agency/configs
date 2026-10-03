/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no fix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no fix. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { configDefaultOutsideLiterals } from '../../../src/rules/effect/config-default-outside-literals';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });
const imports = `import * as Config from 'effect/Config'; import * as Schema from 'effect/Schema';`;

tester.run('config-default-outside-literals', configDefaultOutsideLiterals, {
  valid: [
    `${imports} Config.Literals(['debug', 'info']).pipe(Config.withDefault('info'))`,
    `${imports} Config.Literals(['debug', 'info']).pipe(Config.withDefault(null))`,
    `${imports} Config.withDefault(Config.Literals([-2, +4]), +4)`,
    `${imports} const level: Config.Config<-2 | 4 | -3> = Config.withDefault(Config.Literals([-2, 4]), -3)`,
    `${imports} const level: Config.Config<'debug' | 'info' | 'inof'> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
    `${imports} const level: Config.Config<'debug' | 'info' | 'inof'> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof')) satisfies Config.Config<string>`,
    `${imports} const level: Config.Config<'debug' | 'info' | 'inof'> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof')) as Config.Config<string>`,
    `${imports} const level: Config.Config<-2 | 4 | -3> = (Config.withDefault(Config.Literals([-2, 4]), -3) satisfies Config.Config<number>)!`,
    `${imports} const level: SomeComplexType = <SomeComplexType>Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
    `${imports} const level: Config.Config<string> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
    `${imports} const level: Config.Config<Level> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
    `${imports} const level: Config.Config<'debug' | 'info' | string> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
    `${imports} const level: SomeComplexType = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
    `${imports} Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof' as string))`,
    `${imports} Config.Literals([1, 2]).pipe(Config.withDefault(3 as number))`,
    `${imports} (Config.Literals(['debug', 'info']) as BrandedConfig).pipe(Config.withDefault('inof'))`,
    `${imports} Config.schema(Schema.Literals(['debug', 'info']).pipe(Schema.brand('Level'))).pipe(Config.withDefault('inof'))`,
    `${imports} Config.Literals(['debug', 'info']).pipe(Config.map(f), Config.withDefault('inof'))`,
    `${imports} Config.Literals(['debug', 'info']).pipe(custom).pipe(Config.withDefault('inof'))`,
    `${imports} const level = Config.Literals(['debug', 'info']); level.pipe(Config.withDefault('inof'))`,
    `${imports} import { level } from './schema'; Config.schema(level).pipe(Config.withDefault('inof'))`,
    `${imports} Config.Literals(['debug', 'info']).pipe(Config.withDefault(1))`,
    `${imports} Config.Literals([1, 2]).pipe(Config.withDefault('3'))`,
    `${imports} Config.Literals(['debug', 'info']).pipe(Config.withDefault(undefined))`,
    `${imports} Config.Literals(['debug', 'info']).pipe(Config.withDefault(Option.none()))`,
    `${imports} Config.Literals(['debug', 'info']).pipe(Config.withDefault({ level: 'inof' }))`,
    `${imports} Config.Literals(['debug', 'info']).pipe(Config.withDefault(fallback))`,
    `${imports} Config.Literals(['debug']).pipe(Config.withDefault('inof'))`,
    `${imports} Config.Literals(['debug', 2]).pipe(Config.withDefault('inof'))`,
    `${imports} Config.Literals(['debug', ...levels]).pipe(Config.withDefault('inof'))`,
    `${imports} Config.Literals(['debug', level]).pipe(Config.withDefault('inof'))`,
    `${imports} Config.Literals(['debug', 'info'] as Array<string>).pipe(Config.withDefault('inof'))`,
    `${imports} Config.Literals(['debug', 'info' as string]).pipe(Config.withDefault('inof'))`,
    `${imports} Config.Literals(levels).pipe(Config.withDefault('inof'))`,
    `${imports} Config.literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
    `${imports} Config.String('environment').pipe(Config.withDefault('dev'))`,
    `${imports} Config.String('EXACT_URL').pipe(Config.withDefault('https://start.exactonline.nl'))`,
    `${imports} Config.Number('PORT').pipe(Config.withDefault(3000))`,
    `${imports} Config.Redacted('TOKEN').pipe(Config.withDefault('secret'))`,
    `${imports} Config.Url('OIS_URL').pipe(Config.withDefault('https://example.com'))`,
    `${imports} function f(Config) { Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof')) }`,
    `${imports} function f(Schema) { Config.schema(Schema.Literals(['debug', 'info'])).pipe(Config.withDefault('inof')) }`,
    `${imports} { const Schema = local; Config.schema(Schema.Literals(['debug', 'info'])).pipe(Config.withDefault('inof')) }`,
    `import { withDefault as D } from 'effect/Config'; function f(Config) { D(Config.Literals(['debug', 'info']), 'inof') }`,
    `import { Literals, withDefault } from 'effect/Config'; function f(withDefault) { Literals(['debug', 'info']).pipe(withDefault('inof')) }`,
    `import * as E from 'effect'; function f(E) { E.Config.Literals(['debug', 'info']).pipe(E.Config.withDefault('inof')) }`,
    `import * as Config from './config'; Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
    `import * as Config from '@effect/platform/Config'; Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
    `import type * as Config from 'effect/Config'; Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
  ],
  invalid: [
    {
      code: `${imports}\nConfig.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
      errors: [
        { messageId: 'outsideLiterals', data: { allowed: '"debug", "info"' }, line: 2, column: 59, endColumn: 65 },
      ],
      output: null,
    },
    {
      code: `${imports} Config.withDefault(Config.schema(Schema.Literals(([-2, +4] as const)), 'PORT'), -3)`,
      errors: [{ messageId: 'outsideLiterals', data: { allowed: '-2, 4' } }],
      output: null,
    },
    {
      code: `${imports} Config.Literals([-2, +4], 'PORT').pipe(Config.withDefault(+3))`,
      errors: [{ messageId: 'outsideLiterals', data: { allowed: '-2, 4' } }],
      output: null,
    },
    ...[
      `${imports} const level: Config.Config<'debug' | 'info'> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
      `${imports} const level: Config.Config<'debug' | 'info'> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof')) satisfies Config.Config<string>`,
      `${imports} const level: Config.Config<'debug' | 'info'> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof')) as Config.Config<string>`,
      `${imports} const level: Config.Config<'info' | 'inof'> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'))`,
      `${imports} Config.withDefault(Config.Literals(['debug', 'info']), 'inof')`,
      `${imports} Config.schema(Schema.Literals(['debug', 'info']), 'LEVEL').pipe(Config.withDefault('inof'))`,
      `import { Config as C, Schema as S } from 'effect'; C.withDefault(C.schema(S.Literals(['debug', 'info'])), 'inof')`,
      `import * as E from 'effect'; E.Config.Literals(['debug', 'info']).pipe(E.Config.withDefault('inof'))`,
      `import { Literals as L, withDefault as D } from 'effect/Config'; L((['debug', 'info'] as const)).pipe(D('inof'))`,
      `import { schema as C, withDefault as D } from 'effect/Config'; import { Literals as L } from 'effect/Schema'; C(L(['debug', 'info'])).pipe(D('inof'))`,
      `${imports} Config.Literals(['debug', 'info']).pipe(Config.withDefault(('inof' as const)))`,
    ].map((code) => ({
      code,
      errors: [{ messageId: 'outsideLiterals', data: { allowed: '"debug", "info"' } }],
      output: null,
    })),
  ],
});
