/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules, rules } from '../../../src';
import { noFunctionConfigDefault } from '../../../src/rules/effect/no-function-config-default';
import { testRule } from '../../rule-tester';

const name = 'no-function-config-default';

testRule(name, noFunctionConfigDefault, {
  valid: `
    import * as Config from 'effect/Config'
    Config.withDefault(config, makeDefault())
  `,
  invalid: `
    import * as Config from 'effect/Config'
    Config.withDefault(config, () => makeDefault())
  `,
  messageId: 'functionDefault',
});

testRule(name, noFunctionConfigDefault, {
  valid: `
    import * as Config from 'effect/Config'
    function use(Config) { Config.withDefault(config, () => 2) }
  `,
  invalid: `
    import * as Config from 'effect/Config'
    Config.withDefault(Config.String('S'), () => 'fallback')
  `,
  messageId: 'functionDefault',
});

testRule(name, noFunctionConfigDefault, {
  valid: `
    import * as Config from 'effect/Config'
    Config.withDefault(Config.succeed(() => 1), () => 2)
  `,
  invalid: `
    import * as Config from 'effect/Config'
    Config.withDefault(Config.Number('N'), () => 2)
  `,
  messageId: 'functionDefault',
});

testRule(name, noFunctionConfigDefault, {
  valid: `
    import { Config as C } from 'effect'
    const original = C.succeed(function () { return 1 })
    const config = original
    C.withDefault(config, () => 2)
  `,
  invalid: `
    import * as Config from 'effect/Config'
    let config = Config.succeed(() => 1)
    config = Config.Number('N')
    Config.withDefault(config, () => 2)
  `,
  messageId: 'functionDefault',
});

testRule(name, noFunctionConfigDefault, {
  valid: `
    import { succeed as value, withDefault as fallback } from 'effect/Config'
    value(() => 1).pipe(fallback(() => 2))
  `,
  invalid: `
    import { Number as number, withDefault as fallback } from 'effect/Config'
    number('N').pipe(fallback(() => 2))
  `,
  messageId: 'functionDefault',
});

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });
const configImport = `import * as Config from 'effect/Config';`;
const thunk = '() => fallback()';

tester.run('no-function-config-default binding proof', noFunctionConfigDefault, {
  valid: [
    `${configImport} Config.withDefault(Config.succeed(function () { return 1 }), function () { return 2 });`,
    `import * as E from 'effect'; E.Config.withDefault(E.Config.succeed(() => 1), () => 2);`,
    `import * as C from 'effect/Config'; C.withDefault(C.succeed(() => 1), () => 2);`,
    `import { succeed as value, withDefault as fallback } from 'effect/Config'; fallback(value(() => 1), () => 2);`,
    `${configImport} const config = Config.succeed(() => 1); config.pipe(Config.withDefault(() => 2));`,
    `${configImport} const config = Config.succeed(() => 1); Config.withDefault((config as unknown)!, () => 2);`,
    `${configImport} Config.withDefault(Config.Number('N'), 2);`,
    `${configImport} Config.withDefault(Config.String('S'), 'fallback');`,
    `${configImport} Config.withDefault(config, (value) => value);`,
    `${configImport} Config.withDefault(config, function (value) { return value });`,
    `import * as Config from 'unrelated'; Config.withDefault(Config.Number('N'), () => 2);`,
    `${configImport} { const Config = other; Config.withDefault(config, () => 2); }`,
    `import { withDefault as fallback } from 'effect/Config'; function use(fallback) { fallback(() => 2); }`,
    `import { Config as C } from 'effect'; function use(C) { C.withDefault(config, () => 2); }`,
    `import type { Config } from 'effect'; Config.withDefault(config, () => 2);`,
  ],
  invalid: [
    `Config.withDefault(Config.Number('N'), ${thunk});`,
    `Config.withDefault(Config.String('S'), ${thunk});`,
    `Config.Number('N').pipe(Config.withDefault(${thunk}));`,
    `Config.String('S').pipe(Config.withDefault(${thunk}));`,
    `Config.withDefault(Config.succeed({ run: () => 1 }), ${thunk});`,
    `Config.withDefault(Config.succeed(1), ${thunk});`,
    `Config.withDefault(Config.Number('N').pipe(Config.map(() => () => 1)), ${thunk});`,
    `Config.succeed(() => 1).pipe(Config.map(() => 3), Config.withDefault(${thunk}));`,
    `other.pipe(Config.withDefault(${thunk}));`,
    `Config.withDefault(${thunk});`,
    `import { config } from './config'; Config.withDefault(config, ${thunk});`,
    `const config = makeConfig(); Config.withDefault(config, ${thunk});`,
    `const config = Config.succeed(() => 1); function use(config) { Config.withDefault(config, ${thunk}); }`,
    `let config = Config.succeed(() => 1); Config.withDefault(config, ${thunk});`,
    `const config = Config.succeed(() => 1); config = Config.Number('N'); Config.withDefault(config, ${thunk});`,
    `const config = other; const other = config; Config.withDefault(config, ${thunk});`,
    `const { config } = Config.succeed(() => 1); Config.withDefault(config, ${thunk});`,
    `import { succeed, withDefault } from 'effect/Config'; function use(succeed) { withDefault(succeed(() => 1), ${thunk}); }`,
    `import { Config as C } from 'effect'; C.withDefault(C.String('S'), ${thunk});`,
    `import { withDefault as fallback } from 'effect/Config'; fallback(${thunk});`,
  ].map((body) => ({
    code: `${configImport}\n${body}`,
    filename: 'invalid.ts',
    errors: [
      {
        messageId: 'functionDefault',
        line: 2,
        column: body.indexOf(thunk),
        endLine: 2,
        endColumn: body.indexOf(thunk) + thunk.length,
        suggestions: null,
      },
    ],
    output: null,
  })),
});

describe('no-function-config-default metadata', () => {
  it('keeps the rule registered, recommended and diagnostic-only', () => {
    expect(rules[name]).toBe(noFunctionConfigDefault);
    expect(recommendedRules['2digits/no-function-config-default']).toBe('error');
    expect(noFunctionConfigDefault.meta?.fixable).toBeUndefined();
    expect(noFunctionConfigDefault.meta?.hasSuggestions).toBeUndefined();
  });
});
