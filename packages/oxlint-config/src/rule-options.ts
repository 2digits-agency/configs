import type { AllowWarnDeny } from 'oxlint';

import type { PaddingLineOption, RuleName as TwoDigitsRuleName } from '@2digits/oxlint-plugin';

type RuleWithOptions<T> = AllowWarnDeny | [AllowWarnDeny, T];

type TwoDigitsRuleMap = Partial<
  Record<`2digits/${Exclude<TwoDigitsRuleName, 'padding-line-between-statements'>}`, AllowWarnDeny>
>;

type RegexpRuleName =
  | 'confusing-quantifier'
  | 'control-character-escape'
  | 'match-any'
  | 'negation'
  | 'no-contradiction-with-assertion'
  | 'no-dupe-characters-character-class'
  | 'no-dupe-disjunctions'
  | 'no-empty-alternative'
  | 'no-empty-capturing-group'
  | 'no-empty-character-class'
  | 'no-empty-group'
  | 'no-empty-lookarounds-assertion'
  | 'no-empty-string-literal'
  | 'no-escape-backspace'
  | 'no-extra-lookaround-assertions'
  | 'no-invalid-regexp'
  | 'no-invisible-character'
  | 'no-lazy-ends'
  | 'no-legacy-features'
  | 'no-misleading-capturing-group'
  | 'no-misleading-unicode-character'
  | 'no-missing-g-flag'
  | 'no-non-standard-flag'
  | 'no-obscure-range'
  | 'no-optional-assertion'
  | 'no-potentially-useless-backreference'
  | 'no-super-linear-backtracking'
  | 'no-trivially-nested-assertion'
  | 'no-trivially-nested-quantifier'
  | 'no-unused-capturing-group'
  | 'no-useless-assertions'
  | 'no-useless-backreference'
  | 'no-useless-character-class'
  | 'no-useless-dollar-replacements'
  | 'no-useless-escape'
  | 'no-useless-flag'
  | 'no-useless-lazy'
  | 'no-useless-non-capturing-group'
  | 'no-useless-quantifier'
  | 'no-useless-range'
  | 'no-useless-set-operand'
  | 'no-useless-string-literal'
  | 'no-useless-two-nums-quantifier'
  | 'no-zero-quantifier'
  | 'optimal-lookaround-quantifier'
  | 'optimal-quantifier-concatenation'
  | 'prefer-character-class'
  | 'prefer-d'
  | 'prefer-plus-quantifier'
  | 'prefer-predefined-assertion'
  | 'prefer-question-quantifier'
  | 'prefer-range'
  | 'prefer-set-operation'
  | 'prefer-star-quantifier'
  | 'prefer-unicode-codepoint-escapes'
  | 'prefer-w'
  | 'simplify-set-operations'
  | 'sort-flags'
  | 'strict'
  | 'use-ignore-case';

type SonarRuleName =
  | 'comma-or-logical-or-case'
  | 'concise-regex'
  | 'constructor-for-side-effects'
  | 'content-security-policy'
  | 'cookie-no-httponly'
  | 'cors'
  | 'csrf'
  | 'no-all-duplicated-branches'
  | 'no-collapsible-if'
  | 'no-collection-size-mischeck'
  | 'no-duplicated-branches'
  | 'no-element-overwrite'
  | 'no-empty-collection'
  | 'no-extra-arguments'
  | 'no-for-in-iterable'
  | 'no-gratuitous-expressions'
  | 'no-identical-conditions'
  | 'no-identical-expressions'
  | 'no-identical-functions'
  | 'no-ignored-return'
  | 'no-inverted-boolean-check'
  | 'no-nested-switch'
  | 'no-nested-template-literals'
  | 'no-redundant-boolean'
  | 'no-same-line-conditional'
  | 'no-small-switch'
  | 'no-unused-collection'
  | 'no-use-of-empty-return-value'
  | 'no-useless-catch'
  | 'non-existent-operator'
  | 'prefer-immediate-return'
  | 'prefer-object-literal'
  | 'prefer-single-boolean-return'
  | 'prefer-while'
  | 'elseif-without-else'
  | 'no-redundant-jump';

type StorybookRuleName =
  | 'await-interactions'
  | 'context-in-play-function'
  | 'csf-component'
  | 'default-exports'
  | 'hierarchy-separator'
  | 'meta-inline-properties'
  | 'meta-satisfies-type'
  | 'no-redundant-story-name'
  | 'no-renderer-packages'
  | 'no-stories-of'
  | 'no-title-property-in-meta'
  | 'prefer-pascal-case'
  | 'story-exports'
  | 'use-storybook-expect'
  | 'use-storybook-testing-library';

type TailwindRuleName =
  | 'classnames-order'
  | 'enforces-canonical-classname'
  | 'enforces-negative-arbitrary-values'
  | 'enforces-shorthand'
  | 'important-modifier-suffix'
  | 'no-arbitrary-value'
  | 'no-contradicting-classname'
  | 'no-unnecessary-arbitrary-value';

type TanstackQueryRuleName =
  | 'infinite-query-property-order'
  | 'mutation-property-order'
  | 'no-rest-destructuring'
  | 'no-unstable-deps'
  | 'no-void-query-fn'
  | 'prefer-query-options'
  | 'stable-query-client';

type PluginRuleMap = Partial<
  Record<
    | `regexp/${RegexpRuleName}`
    | `sonar/${SonarRuleName}`
    | `storybook/${StorybookRuleName}`
    | `tailwindcss/${TailwindRuleName}`
    | `tanstack-query/${TanstackQueryRuleName}`
    | 'antfu/top-level-function'
    | 'boolean/no-negated-conjunction'
    | 'next/no-location-assign-relative-destination'
    | 'tanstack-router/create-route-property-order'
    | 'tanstack-router/route-param-names',
    AllowWarnDeny
  >
>;

interface DrizzleOptions {
  readonly drizzleObjectName?: string | Array<string>;
}

interface NoConflictingChecksOptions {
  readonly checkConfusingCases?: boolean;
  readonly checkImpossibleCases?: boolean;
  readonly checkInapplicableChecks?: boolean;
}

/**
 * Register rules provided by external JavaScript plugins.
 *
 * Keep these declarations synchronized with the configured plugin versions.
 */
declare module 'oxlint' {
  interface DummyRuleMap extends TwoDigitsRuleMap, PluginRuleMap {
    '2digits/padding-line-between-statements'?: AllowWarnDeny | [AllowWarnDeny, ...Array<PaddingLineOption>];
    'boolean/no-negated-disjunction'?: RuleWithOptions<{ readonly enforceForMixedOperators?: boolean }>;
    'depend/ban-dependencies'?: RuleWithOptions<{
      readonly allowed?: Array<string>;
      readonly modules?: Array<string>;
      readonly presets?: Array<string>;
    }>;
    'drizzle/enforce-delete-with-where'?: RuleWithOptions<DrizzleOptions>;
    'drizzle/enforce-update-with-where'?: RuleWithOptions<DrizzleOptions>;
    'sonar/cognitive-complexity'?: AllowWarnDeny | [AllowWarnDeny, number];
    'sonar/content-length'?: RuleWithOptions<{
      readonly fileUploadSizeLimit?: number;
      readonly standardSizeLimit?: number;
    }>;
    'sonar/max-switch-cases'?: AllowWarnDeny | [AllowWarnDeny, number];
    'sonar/no-duplicate-string'?: RuleWithOptions<{ readonly ignoreStrings?: string; readonly threshold?: number }>;
    'storybook/no-uninstalled-addons'?: RuleWithOptions<{
      readonly ignore?: Array<string>;
      readonly packageJsonLocation?: string;
    }>;
    'stylistic/jsx-curly-newline'?: AllowWarnDeny;
    'stylistic/jsx-newline'?: RuleWithOptions<{
      readonly allowMultilines?: boolean;
      readonly prevent?: boolean;
    }>;
    'tailwindcss/no-custom-classname'?: RuleWithOptions<{ readonly whitelist?: Array<string> }>;
    'tanstack-query/exhaustive-deps'?: RuleWithOptions<{
      readonly allowlist?: { readonly types?: Array<string>; readonly variables?: Array<string> };
    }>;
    'turbo/no-undeclared-env-vars'?: RuleWithOptions<{ readonly allowList?: Array<string>; readonly cwd?: string }>;
    'zod/array-style'?: RuleWithOptions<{ readonly style: 'function' | 'method' }>;
    'zod/consistent-import'?: RuleWithOptions<{ readonly syntax: 'default' | 'named' | 'namespace' }>;
    'zod/consistent-import-source'?: RuleWithOptions<{ readonly sources: Array<'zod' | 'zod/v3' | 'zod/v4'> }>;
    'zod/consistent-object-schema-type'?: RuleWithOptions<{
      readonly allow: Array<'looseObject' | 'object' | 'strictObject'>;
    }>;
    'zod/consistent-schema-output-type-style'?: RuleWithOptions<{
      readonly style: 'infer' | 'output';
    }>;
    'zod/consistent-schema-var-name'?: RuleWithOptions<{
      readonly after?: string;
      readonly before?: string;
    }>;
    'zod/no-any-schema'?: AllowWarnDeny;
    'zod/no-coerce-boolean'?: AllowWarnDeny;
    'zod/no-conflicting-checks'?: RuleWithOptions<NoConflictingChecksOptions>;
    'zod/no-duplicate-schema-methods'?: AllowWarnDeny;
    'zod/no-dynamic-schema-value'?: AllowWarnDeny;
    'zod/no-empty-custom-schema'?: AllowWarnDeny;
    'zod/no-function-scoped-schema'?: AllowWarnDeny;
    'zod/no-native-enum'?: AllowWarnDeny;
    'zod/no-number-schema-with-finite'?: AllowWarnDeny;
    'zod/no-number-schema-with-int'?: AllowWarnDeny;
    'zod/no-number-schema-with-is-finite'?: AllowWarnDeny;
    'zod/no-number-schema-with-is-int'?: AllowWarnDeny;
    'zod/no-number-schema-with-safe'?: AllowWarnDeny;
    'zod/no-number-schema-with-step'?: AllowWarnDeny;
    'zod/no-optional-and-default-together'?: RuleWithOptions<{
      readonly preferredMethod: 'default' | 'none' | 'optional';
    }>;
    'zod/no-promise-schema'?: AllowWarnDeny;
    'zod/no-schema-with-is-nullable'?: AllowWarnDeny;
    'zod/no-schema-with-is-optional'?: AllowWarnDeny;
    'zod/no-throw-in-refine'?: AllowWarnDeny;
    'zod/no-transform-in-record-key'?: AllowWarnDeny;
    'zod/no-unknown-schema'?: AllowWarnDeny;
    'zod/no-unnecessary-readonly'?: AllowWarnDeny;
    'zod/prefer-enum-over-literal-union'?: AllowWarnDeny;
    'zod/prefer-loose-object'?: AllowWarnDeny;
    'zod/prefer-map-set-size-over-min-max'?: AllowWarnDeny;
    'zod/prefer-meta'?: AllowWarnDeny;
    'zod/prefer-meta-last'?: AllowWarnDeny;
    'zod/prefer-nullish'?: AllowWarnDeny;
    'zod/prefer-strict-object'?: AllowWarnDeny;
    'zod/prefer-string-length-over-min-max'?: AllowWarnDeny;
    'zod/prefer-string-schema-with-trim'?: AllowWarnDeny;
    'zod/prefer-top-level-string-formats'?: RuleWithOptions<{ readonly ignore?: Array<string> }>;
    'zod/prefer-trim-before-string-length-checks'?: AllowWarnDeny;
    'zod/prefer-tuple-over-array-length'?: AllowWarnDeny;
    'zod/prefer-validate'?: AllowWarnDeny;
    'zod/require-brand-type-parameter'?: AllowWarnDeny;
    'zod/require-error-message'?: AllowWarnDeny;
    'zod/schema-error-property-style'?: RuleWithOptions<{
      readonly example: string;
      readonly selector: string;
    }>;
  }
}
