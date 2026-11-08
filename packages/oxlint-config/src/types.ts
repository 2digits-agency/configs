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

export interface OptionsWithReact extends OptionsWithFiles {
  /**
   * Enable native web accessibility and DOM property checks. Disabled by default for React Native compatibility.
   * Inherits React's file patterns unless `web.files` is provided; web rule overrides belong in `web.overrides`.
   *
   * @default false
   */
  web?: boolean | OptionsWithFiles;
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
