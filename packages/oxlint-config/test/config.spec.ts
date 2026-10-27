import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import zodPlugin from 'eslint-plugin-zod';
import { describe, expect, it } from 'vite-plus/test';

import eslintTwoDigits from '@2digits/eslint-config';
import { recommendedRules } from '@2digits/oxlint-plugin';

import twoDigits, { type FlatConfigItem, type RuleName } from '../src';
import { javascript, node, react, twoDigitsPlugin, typescript, unicorn, vitest, zod } from '../src/configs';
import { runOxlint, withTemporaryProject } from './oxlint';

/**
 * The rules of the named config object.
 *
 * @param configs Config objects returned by a config function.
 * @param name Config object name.
 */
function rulesOf(configs: Array<FlatConfigItem>, name: string) {
  return configs.find((config) => config.name === name)?.rules ?? {};
}

const javascriptRules = rulesOf(javascript(), '2digits:javascript');

const reactConfig = react().find(({ name }) => name === '2digits:react/rules');

const reactRules = reactConfig?.rules ?? {};

const zodConfig = zod().at(0);

const zodRules = zodConfig?.rules ?? {};

const twoDigitsPluginConfig = twoDigitsPlugin().at(0);

const twoDigitsPluginRules = twoDigitsPluginConfig?.rules ?? {};

/**
 * The first JS plugin of a config object, normalized to its object form.
 *
 * @param config Config object.
 */
function jsPluginOf(config: FlatConfigItem | undefined) {
  const [entry] = config?.jsPlugins ?? [];

  return typeof entry === 'string' ? { name: entry, specifier: entry } : entry;
}

const fixtureDirectory = fileURLToPath(new URL('fixtures/zod', import.meta.url));

const twoDigitsFixtureDirectory = fileURLToPath(new URL('fixtures/2digits', import.meta.url));

const booleanFixtureDirectory = fileURLToPath(new URL('fixtures/boolean', import.meta.url));

const headerFixtureDirectory = fileURLToPath(new URL('fixtures/http-api-headers', import.meta.url));

const invalidFixture = 'invalid.mjs';

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
] satisfies Array<RuleName>;

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

// Oxlint carries TypeScript `_` ignore patterns and preserves case-sensitive Fallow directives.
const sharedJavascriptRuleNames = new Set(
  Object.entries(javascriptRules)
    .filter(([rule, value]) => value !== undefined && rule !== 'no-unused-vars' && rule !== 'capitalized-comments')
    .map(([rule]) => rule),
);

const sharedEslintJavascriptRules = Object.fromEntries(
  Object.entries(eslintJavascriptConfig?.rules ?? {}).filter(
    ([rule, value]) => value !== undefined && sharedJavascriptRuleNames.has(rule),
  ),
);

describe('oxlint config', () => {
  const toggledConfig = twoDigits(
    {
      ignores: { ignores: ['generated/**'] },
      js: { overrides: { 'eslint/no-console': 'warn' } },
      react: false,
      ts: true,
      vitest: { files: ['**/*.check.ts'] },
      zod: false,
    },
    { options: { reportUnusedDisableDirectives: 'allow' } },
    { files: ['**/*.ts'], rules: { 'eslint/no-console': 'off' } },
  );

  it('merges root options and appends consumer configs after the built-in configs', () => {
    expect(toggledConfig.options).toStrictEqual({
      denyWarnings: true,
      reportUnusedDisableDirectives: 'allow',
      typeAware: true,
    });

    expect(toggledConfig.ignorePatterns).toContain('/**/fixtures/**');

    expect(toggledConfig.ignorePatterns?.at(-1)).toBe('/generated/**');

    expect(toggledConfig.overrides?.at(-1)).toMatchObject({
      files: ['**/*.ts'],
      rules: { 'eslint/no-console': 'off' },
    });
  });

  it('applies config options and integration toggles', () => {
    const javascriptOverride = toggledConfig.overrides?.find(({ rules }) => rules?.['eslint/no-console'] === 'warn');

    const vitestOverride = toggledConfig.overrides?.find(({ rules }) => rules?.['vitest/no-focused-tests'] === 'error');

    expect(javascriptOverride?.env).toStrictEqual({ browser: true, node: true });

    expect(vitestOverride?.files).toStrictEqual(['**/*.check.ts']);

    expect(JSON.stringify(toggledConfig)).not.toMatch(/"react\/jsx-key"|"zod\//u);
  });

  it('matches all shared ESLint JavaScript rules', () => {
    expect(eslintJavascriptConfig?.rules).toBeDefined();

    expect(javascriptRules).toMatchObject(sharedEslintJavascriptRules);
  });

  it('exposes the Fallow directive exception through the shared preset', () => {
    const config = twoDigits();

    const javascript = config.overrides?.find((override) => override.rules?.['capitalized-comments'] !== undefined);

    expect(javascript?.rules?.['capitalized-comments']).toStrictEqual([
      'error',
      'always',
      { ignorePattern: String.raw`^\s*fallow-ignore(?:-|\b)` },
    ]);
  });

  describe('uses every native React Compiler rule', () => {
    it("doesn't use the 'react-compiler' plugin", () => {
      expect(jsPluginOf(reactConfig)?.name).toBe('stylistic');

      expect(reactConfig?.jsPlugins).toHaveLength(1);
    });

    it.for(reactCompilerRules)('$name is an error', (rule) => {
      expect(reactRules[rule], rule).toBe('error');
    });
  });

  it('matches shared non-core ESLint rule behavior', () => {
    expect({
      node: rulesOf(node(), '2digits:node')['node/handle-callback-err'],
      react: reactRules['react/hook-use-state'],
    }).toStrictEqual({
      node: ['error', '^(err|error)$'],
      react: 'error',
    });

    expect(rulesOf(typescript(), '2digits:typescript/rules')).toMatchObject({
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

    expect(rulesOf(unicorn(), '2digits:unicorn')).toMatchObject({
      'unicorn/prefer-at': 'error',
      'unicorn/prefer-object-from-entries': 'error',
      'unicorn/prefer-structured-clone': 'error',
      'unicorn/switch-case-braces': 'error',
      'unicorn/throw-new-error': 'off',
    });

    expect(rulesOf(vitest(), '2digits:vitest/rules')).toMatchObject({
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
    expect(jsPluginOf(zodConfig)).toMatchObject({ name: 'zod' });

    expect(jsPluginOf(zodConfig)?.specifier).toContain('eslint-plugin-zod');

    expect(zodRules['zod/array-style']).toStrictEqual(['error', { style: 'function' }]);

    // Every plugin rule is configured or explicitly left unset.
    const { rules } = zodPlugin as typeof zodPlugin & { rules: Record<string, unknown> };

    expect(Object.keys(zodRules).toSorted()).toStrictEqual(
      Object.keys(rules)
        .map((rule) => `zod/${rule}`)
        .toSorted(),
    );
  });

  it('configures every recommended 2digits rule', () => {
    const { '2digits/padding-line-between-statements': _spacing, ...otherRecommendedRules } = recommendedRules;

    expect(jsPluginOf(twoDigitsPluginConfig)).toMatchObject({ name: '2digits' });

    expect(jsPluginOf(twoDigitsPluginConfig)?.specifier).toContain('oxlint-plugin/dist/index.mjs');

    expect(twoDigitsPluginRules).toMatchObject(otherRecommendedRules);

    expect(twoDigitsPluginRules['2digits/padding-line-between-statements']).toContain('error');

    expect([
      recommendedRules['2digits/prefer-effect-filesystem'],
      recommendedRules['2digits/prefer-effect-path'],
    ]).toStrictEqual([undefined, undefined]);
  });

  it('enables Effect duration guidance by default', () => {
    expect([
      recommendedRules['2digits/prefer-effect-duration'],
      recommendedRules['2digits/prefer-effect-duration-constants'],
    ]).toStrictEqual(['error', 'error']);
  });

  it('keeps binary-patched effecttsgo rules out of the default preset', () => {
    expect(JSON.stringify(twoDigits({ react: true, ts: true, vitest: true, zod: true }))).not.toContain('effecttsgo');
  });

  it('loads and executes eslint-plugin-zod', () => {
    const { status, output } = runOxlint(fixtureDirectory, invalidFixture);

    expect(status).toBe(1);

    expect(output).toContain('zod(array-style)');
  });

  it('loads and executes eslint-plugin-de-morgan', () => {
    const { status, output } = runOxlint(booleanFixtureDirectory, invalidFixture);

    expect(status).toBe(1);

    expect(output).toContain('boolean(no-negated-conjunction)');

    expect(output).toContain('boolean(no-negated-disjunction)');
  });

  it('loads and executes @2digits/oxlint-plugin', () => {
    const { status, output } = runOxlint(twoDigitsFixtureDirectory, invalidFixture);

    expect(status).toBe(1);

    expect(output).toContain('2digits(no-empty-schema-struct)');

    expect(output.match(/2digits\(no-function-config-default\)/g)).toHaveLength(2);

    expect(output).toContain('2digits(prefer-effect-duration-constants)');
  });

  it('diagnoses endpoint header keys through the production config and built plugin', () => {
    const bad = runOxlint(headerFixtureDirectory, invalidFixture);

    const good = runOxlint(headerFixtureDirectory, 'valid.mjs');

    expect(recommendedRules['2digits/no-uppercase-http-api-header']).toBe('error');

    expect(bad.status, bad.output).toBe(1);

    expect(bad.output.match(/2digits\(no-uppercase-http-api-header\)/gu)).toHaveLength(2);

    expect(good.status, good.output).toBe(0);
  });

  it('never edits header contracts or lowercase collisions under --fix', () => {
    const fixture = readFileSync(path.join(headerFixtureDirectory, invalidFixture), 'utf8');

    withTemporaryProject({ [invalidFixture]: fixture }, (directory) => {
      const target = path.join(directory, invalidFixture);

      const result = runOxlint(headerFixtureDirectory, '--fix', target);

      expect(result.status, result.output).toBe(1);

      expect(result.output.match(/2digits\(no-uppercase-http-api-header\)/gu)).toHaveLength(2);

      expect(readFileSync(target, 'utf8')).toBe(fixture);
    });
  });
});
