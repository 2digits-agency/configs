import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import eslintTwoDigits from '@2digits/eslint-config';

import withTwoDigits, { twoDigits, type TwoDigitsConfig } from '../src';
import { javascriptConfig } from '../src/configs/javascript';
import { nodeConfig } from '../src/configs/node';
import { reactConfig } from '../src/configs/react';
import { typescriptRulesConfig } from '../src/configs/typescript';
import { unicornConfig } from '../src/configs/unicorn';
import { vitestConfig } from '../src/configs/vitest';
import { zodConfig } from '../src/configs/zod';
import { effectConfig } from '../src/effect';

const fixtureDirectory = fileURLToPath(new URL('fixtures/zod', import.meta.url));
const oxlintBinary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));

const eslintConfig = await eslintTwoDigits({
  css: false,
  depend: false,
  drizzle: false,
  graphql: false,
  next: false,
  pnpm: false,
  react: false,
  storybook: false,
  tailwind: false,
  tanstackQuery: false,
  tanstackRouter: false,
  ts: false,
  turbo: false,
  vitest: false,
  zod: false,
});
const eslintJavascriptConfig = eslintConfig.find(({ name }) => name === '2digits:javascript');

// Oxlint's core rule also covers TypeScript, so it carries the TypeScript `_` ignore patterns.
const sharedJavascriptRuleNames = new Set(
  Object.entries(javascriptConfig.rules)
    .filter(([rule, value]) => value !== undefined && rule !== 'no-unused-vars')
    .map(([rule]) => rule),
);
const sharedEslintJavascriptRules = Object.fromEntries(
  Object.entries(eslintJavascriptConfig?.rules ?? {}).filter(
    ([rule, value]) => value !== undefined && sharedJavascriptRuleNames.has(rule),
  ),
);

function collectPluginsAndRules(config: TwoDigitsConfig): Array<string> {
  const nested = config.extends ?? [];

  return [
    ...(config.plugins ?? []),
    ...Object.keys(config.rules ?? {}),
    ...nested.flatMap((child) => collectPluginsAndRules(child)),
  ];
}

const defaultPresetEffectEntries = collectPluginsAndRules(twoDigits).filter((entry) => entry.startsWith('effecttsgo'));
const effectRules = Object.entries(effectConfig.rules ?? {});
const foreignEffectRules = effectRules.filter(([rule]) => !rule.startsWith('effecttsgo/')).map(([rule]) => rule);
const effectWarnings = effectRules.filter(([, severity]) => severity === 'warn').map(([rule]) => rule);

describe('oxlint config', () => {
  it('preserves top-level defaults when extending the config', () => {
    const config = withTwoDigits(
      {
        rules: {
          'eslint/no-console': 'warn',
        },
      },
      {
        rules: {
          'eslint/no-console': 'off',
        },
      },
    );

    expect(config.env).toMatchObject({ browser: true, node: true });
    expect(config.ignorePatterns).toContain('**/fixtures/**');
    expect(config.rules?.['eslint/no-console']).toBe('off');
    expect(twoDigits.env).toMatchObject({ browser: true, node: true });
  });

  it('matches all shared ESLint JavaScript rules', () => {
    expect(eslintJavascriptConfig?.rules).toBeDefined();
    expect(javascriptConfig.rules).toMatchObject(sharedEslintJavascriptRules);
  });

  it('matches shared non-core ESLint rule behavior', () => {
    expect({
      node: nodeConfig.rules['node/handle-callback-err'],
      react: reactConfig.rules['react/hook-use-state'],
    }).toStrictEqual({
      node: ['error', '^(err|error)$'],
      react: 'error',
    });
    expect(typescriptRulesConfig.rules).toMatchObject({
      'typescript/consistent-type-exports': ['error'],
      'typescript/no-confusing-void-expression': 'off',
      'typescript/no-explicit-any': ['error'],
      'typescript/no-extraneous-class': 'error',
      'typescript/no-import-type-side-effects': ['error'],
      'typescript/no-misused-promises': 'off',
      'typescript/no-namespace': 'error',
      'typescript/no-unnecessary-condition': 'error',
      'typescript/no-unnecessary-type-assertion': 'off',
      'typescript/restrict-plus-operands': [
        'error',
        { allowAny: false, allowBoolean: false, allowNullish: false, allowNumberAndString: false, allowRegExp: false },
      ],
    });
    expect(unicornConfig.rules).toMatchObject({
      'unicorn/prefer-at': 'error',
      'unicorn/prefer-object-from-entries': 'error',
      'unicorn/prefer-structured-clone': 'error',
      'unicorn/switch-case-braces': 'error',
      'unicorn/throw-new-error': 'off',
    });
    expect(vitestConfig.rules).toMatchObject({
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
      'vitest/expect-expect': [
        'error',
        {
          additionalTestBlockFunctions: ['it', 'it.effect', 'it.scoped'],
          assertFunctionNames: ['expect', 'expectTypeOf', 'assert', 'assertType', 'assert*', '*Equal'],
        },
      ],
      'vitest/no-standalone-expect': ['error', { additionalTestBlockFunctions: ['it', 'it.effect', 'it.scoped'] }],
    });
  });

  it('configures eslint-plugin-zod', () => {
    const plugin = zodConfig.jsPlugins.at(0);

    expect(plugin?.name).toBe('zod');
    expect(plugin?.specifier).toContain('eslint-plugin-zod');
    expect(zodConfig.rules['zod/array-style']).toStrictEqual(['error', { style: 'function' }]);
  });

  it('keeps the Effect rules out of the default preset', () => {
    expect(defaultPresetEffectEntries).toStrictEqual([]);
  });

  it('enables the patched effecttsgo plugin in type-aware mode', () => {
    expect(effectConfig.plugins).toStrictEqual(['effecttsgo']);
    expect(effectConfig.options).toMatchObject({ typeAware: true });
    expect(foreignEffectRules).toStrictEqual([]);
    expect(effectWarnings).toStrictEqual([
      'effecttsgo/missing-pipeable-signature',
      'effecttsgo/strict-boolean-expressions',
      'effecttsgo/strict-effect-provide',
    ]);
  });

  it('loads and executes eslint-plugin-zod', () => {
    const result = spawnSync(process.execPath, [oxlintBinary, '--config=oxlint.config.mjs', 'invalid.mjs'], {
      cwd: fixtureDirectory,
      encoding: 'utf8',
    });

    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('zod(array-style)');
  });
});
