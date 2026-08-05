import type { AllowWarnDeny } from 'oxlint';

type RuleWithOptions<T> = AllowWarnDeny | [AllowWarnDeny, T];

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
  interface DummyRuleMap {
    'react-compiler/react-compiler'?: AllowWarnDeny;
    'stylistic/jsx-curly-newline'?: AllowWarnDeny;
    'stylistic/jsx-newline'?: RuleWithOptions<{ readonly allowMultilines?: boolean; readonly prevent?: boolean }>;
    'zod/array-style'?: RuleWithOptions<{ readonly style: 'function' | 'method' }>;
    'zod/consistent-import'?: RuleWithOptions<{ readonly syntax: 'named' | 'namespace' }>;
    'zod/consistent-import-source'?: RuleWithOptions<{ readonly sources: Array<string> }>;
    'zod/consistent-object-schema-type'?: RuleWithOptions<{
      readonly allow: Array<'looseObject' | 'object' | 'strictObject'>;
    }>;
    'zod/consistent-schema-output-type-style'?: RuleWithOptions<{ readonly style: 'infer' | 'output' }>;
    'zod/consistent-schema-var-name'?: RuleWithOptions<{ readonly after?: string; readonly before?: string }>;
    'zod/no-any-schema'?: AllowWarnDeny;
    'zod/no-coerce-boolean'?: AllowWarnDeny;
    'zod/no-conflicting-checks'?: RuleWithOptions<NoConflictingChecksOptions>;
    'zod/no-duplicate-schema-methods'?: AllowWarnDeny;
    'zod/no-empty-custom-schema'?: AllowWarnDeny;
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
    'zod/no-string-schema-with-uuid'?: AllowWarnDeny;
    'zod/no-throw-in-refine'?: AllowWarnDeny;
    'zod/no-transform-in-record-key'?: AllowWarnDeny;
    'zod/no-unknown-schema'?: AllowWarnDeny;
    'zod/no-unnecessary-readonly'?: AllowWarnDeny;
    'zod/prefer-enum-over-literal-union'?: AllowWarnDeny;
    'zod/prefer-loose-object'?: AllowWarnDeny;
    'zod/prefer-meta'?: AllowWarnDeny;
    'zod/prefer-meta-last'?: AllowWarnDeny;
    'zod/prefer-strict-object'?: AllowWarnDeny;
    'zod/prefer-string-schema-with-trim'?: AllowWarnDeny;
    'zod/prefer-top-level-string-formats'?: AllowWarnDeny;
    'zod/prefer-trim-before-string-length-checks'?: AllowWarnDeny;
    'zod/prefer-tuple-over-array-length'?: AllowWarnDeny;
    'zod/require-brand-type-parameter'?: AllowWarnDeny;
    'zod/require-error-message'?: AllowWarnDeny;
    'zod/schema-error-property-style'?: RuleWithOptions<{ readonly example: string; readonly selector: string }>;
  }
}
