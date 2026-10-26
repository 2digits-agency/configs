import type { DummyRuleMap } from 'oxlint';

export type { ConfigInput, FlatConfigItem } from 'oxlint-flat-config';

export type { DummyRuleMap, DummyRuleMap as RuleMap, OxlintConfig } from 'oxlint';

export type Rules = DummyRuleMap;

export type RuleName = keyof DummyRuleMap;

export interface OptionsOverrides {
  overrides?: Rules;
}

export interface OptionsWithFiles extends OptionsOverrides {
  /**
   * An array of glob patterns to match the files to which this configuration applies.
   */
  files?: Array<string>;
}

export interface OptionsWithVitest extends OptionsWithFiles {
  /**
   * Enable type-aware Vitest lint rules for `expectTypeOf` and related APIs.
   *
   * @default true
   */
  typecheck?: boolean;
}

export interface OptionsWithIgnores {
  /**
   * An array of glob patterns to ignore in addition to the default ignores.
   */
  ignores?: Array<string>;
}
