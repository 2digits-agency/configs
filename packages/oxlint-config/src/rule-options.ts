import '@oxlint-types/define-config';

type RestrictedGlobal = string | { readonly message?: string; readonly name: string };

interface NoUnusedVariablesOptions {
  readonly args?: 'after-used' | 'all' | 'none';
  readonly argsIgnorePattern?: string;
  readonly caughtErrors?: 'all' | 'none';
  readonly caughtErrorsIgnorePattern?: string;
  readonly ignoreRestSiblings?: boolean;
  readonly vars?: 'all' | 'local';
  readonly varsIgnorePattern?: string;
}

interface NoConflictingChecksOptions {
  readonly checkConfusingCases?: boolean;
  readonly checkImpossibleCases?: boolean;
  readonly checkInapplicableChecks?: boolean;
}

/**
 * Correct generated option shapes that differ from Oxlint's ESLint-compatible tuples and register external JS rules.
 *
 * Keep these patches synchronized with the installed Oxlint and external plugin versions.
 */
declare module '@oxlint-types/define-config' {
  interface RuleOptionsPatch {
    'eslint/arrow-body-style': 'always' | 'as-needed' | 'never';
    'eslint/eqeqeq': 'always' | 'smart';
    'eslint/func-names': 'always' | 'as-needed' | 'never';
    'eslint/func-style': 'declaration' | 'expression';
    'eslint/logical-assignment-operators': 'always' | 'never';
    'eslint/no-restricted-globals': RestrictedGlobal;
    'eslint/no-unused-vars': NoUnusedVariablesOptions;
    'eslint/prefer-destructuring': { readonly array?: boolean; readonly object?: boolean };
    'eslint/yoda': 'always' | 'never';
    'react-compiler/react-compiler': never;
    'react_perf/jsx-no-jsx-as-prop': never;
    'react_perf/jsx-no-new-array-as-prop': never;
    'react_perf/jsx-no-new-function-as-prop': never;
    'react_perf/jsx-no-new-object-as-prop': never;
    'stylistic/jsx-curly-newline': never;
    'stylistic/jsx-newline': { readonly allowMultilines?: boolean; readonly prevent?: boolean };
    'typescript/ban-ts-comment': {
      readonly 'ts-check'?: 'allow-with-description' | boolean;
      readonly 'ts-expect-error'?: 'allow-with-description' | boolean;
      readonly 'ts-ignore'?: 'allow-with-description' | boolean;
      readonly 'ts-nocheck'?: 'allow-with-description' | boolean;
      readonly minimumDescriptionLength?: number;
    };
    'typescript/consistent-generic-constructors': 'constructor' | 'type-annotation';
    'typescript/no-empty-interface': { readonly allowSingleExtends?: boolean };
    'vitest/consistent-each-for': {
      readonly describe?: 'each' | 'for';
      readonly it?: 'each' | 'for';
      readonly suite?: 'each' | 'for';
      readonly test?: 'each' | 'for';
    };
    'vitest/consistent-vitest-vi': { readonly fn?: 'vi' | 'vitest' };
    'zod/array-style': { readonly style: 'function' | 'method' };
    'zod/consistent-import': { readonly syntax: 'named' | 'namespace' };
    'zod/consistent-import-source': { readonly sources: Array<string> };
    'zod/consistent-object-schema-type': {
      readonly allow: Array<'looseObject' | 'object' | 'strictObject'>;
    };
    'zod/consistent-schema-output-type-style': { readonly style: 'infer' | 'output' };
    'zod/consistent-schema-var-name': { readonly after?: string; readonly before?: string };
    'zod/no-any-schema': never;
    'zod/no-coerce-boolean': never;
    'zod/no-conflicting-checks': NoConflictingChecksOptions;
    'zod/no-duplicate-schema-methods': never;
    'zod/no-empty-custom-schema': never;
    'zod/no-native-enum': never;
    'zod/no-number-schema-with-finite': never;
    'zod/no-number-schema-with-int': never;
    'zod/no-number-schema-with-is-finite': never;
    'zod/no-number-schema-with-is-int': never;
    'zod/no-number-schema-with-safe': never;
    'zod/no-number-schema-with-step': never;
    'zod/no-optional-and-default-together': {
      readonly preferredMethod: 'default' | 'none' | 'optional';
    };
    'zod/no-promise-schema': never;
    'zod/no-schema-with-is-nullable': never;
    'zod/no-schema-with-is-optional': never;
    'zod/no-string-schema-with-uuid': never;
    'zod/no-throw-in-refine': never;
    'zod/no-transform-in-record-key': never;
    'zod/no-unknown-schema': never;
    'zod/no-unnecessary-readonly': never;
    'zod/prefer-enum-over-literal-union': never;
    'zod/prefer-loose-object': never;
    'zod/prefer-meta': never;
    'zod/prefer-meta-last': never;
    'zod/prefer-strict-object': never;
    'zod/prefer-string-schema-with-trim': never;
    'zod/prefer-top-level-string-formats': never;
    'zod/prefer-trim-before-string-length-checks': never;
    'zod/prefer-tuple-over-array-length': never;
    'zod/require-brand-type-parameter': never;
    'zod/require-error-message': never;
    'zod/schema-error-property-style': { readonly example: string; readonly selector: string };
  }
}
