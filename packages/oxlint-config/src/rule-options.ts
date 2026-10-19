import type { AllowWarnDeny } from 'oxlint';

import type { PaddingLineOption, RuleName as TwoDigitsRuleName } from '@2digits/oxlint-plugin';

type RuleWithOptions<T> = AllowWarnDeny | [AllowWarnDeny, T];

type TwoDigitsRuleMap = Partial<
  Record<`2digits/${Exclude<TwoDigitsRuleName, 'padding-line-between-statements'>}`, AllowWarnDeny>
>;

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
  interface DummyRuleMap extends TwoDigitsRuleMap {
    '2digits/padding-line-between-statements'?: AllowWarnDeny | [AllowWarnDeny, ...Array<PaddingLineOption>];
    'stylistic/jsx-curly-newline'?: AllowWarnDeny;
    'stylistic/jsx-newline'?: RuleWithOptions<{
      readonly allowMultilines?: boolean;
      readonly prevent?: boolean;
    }>;
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
