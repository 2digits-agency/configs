import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import eslintTwoDigits from '@2digits/eslint-config';
import { recommendedRules } from '@2digits/oxlint-plugin';

import withTwoDigits, { twoDigits, type TwoDigitsConfig } from '../src';
import { twoDigitsPluginConfig } from '../src/configs/2digits';
import { javascriptConfig } from '../src/configs/javascript';
import { nodeConfig } from '../src/configs/node';
import { reactConfig } from '../src/configs/react';
import { typescriptRulesConfig } from '../src/configs/typescript';
import { unicornConfig } from '../src/configs/unicorn';
import { vitestConfig } from '../src/configs/vitest';
import { zodConfig } from '../src/configs/zod';

const fixtureDirectory = fileURLToPath(new URL('fixtures/zod', import.meta.url));
const twoDigitsFixtureDirectory = fileURLToPath(new URL('fixtures/2digits', import.meta.url));
const oxlintBinary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));

const reactCompilerRules = [
  'react/capitalized-calls',
  'react/error-boundaries',
  'react/exhaustive-effect-dependencies',
  'react/globals',
  'react/hooks',
  'react/immutability',
  'react/incompatible-library',
  'react/invariant',
  'react/memo-dependencies',
  'react/no-deriving-state-in-effects',
  'react/preserve-manual-memoization',
  'react/purity',
  'react/refs',
  'react/rule-suppression',
  'react/set-state-in-effect',
  'react/set-state-in-render',
  'react/static-components',
  'react/syntax',
  'react/todo',
  'react/unsupported-syntax',
  'react/use-memo',
  'react/void-use-memo',
] satisfies Array<keyof typeof reactConfig.rules>;

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

  it('uses every native React Compiler rule', ({ expect }) => {
    expect(reactConfig.jsPlugins.map(({ name }) => name)).not.toContain('react-compiler');

    for (const rule of reactCompilerRules) {
      expect(reactConfig.rules[rule], rule).toBe('error');
    }
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
        {
          allowAny: false,
          allowBoolean: false,
          allowNullish: false,
          allowNumberAndString: false,
          allowRegExp: false,
        },
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

  it('configures every recommended 2digits rule', () => {
    const plugin = twoDigitsPluginConfig.jsPlugins.at(0);

    expect(plugin?.name).toBe('2digits');
    expect(plugin?.specifier).toContain('oxlint-plugin/dist/index.mjs');
    expect(twoDigitsPluginConfig.rules).toStrictEqual(recommendedRules);
    expect(recommendedRules['2digits/prefer-effect-filesystem']).toBeUndefined();
    expect(recommendedRules['2digits/prefer-effect-path']).toBeUndefined();
  });

  it('keeps binary-patched effecttsgo rules out of the default preset', () => {
    expect(defaultPresetEffectEntries).toStrictEqual([]);
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

  it('loads and executes @2digits/oxlint-plugin', () => {
    const result = spawnSync(process.execPath, [oxlintBinary, '--config=oxlint.config.mjs', 'invalid.mjs'], {
      cwd: twoDigitsFixtureDirectory,
      encoding: 'utf8',
    });

    const output = `${result.stdout}${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('2digits(no-empty-schema-struct)');
  });
});
