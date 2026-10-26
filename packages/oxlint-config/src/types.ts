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

export interface OptionsWithDrizzle extends OptionsOverrides {
  /**
   * Object names which refer to a Drizzle instance.
   *
   * @default ```['drizzle', 'db']```
   */
  drizzleObjectName?: string | Array<string>;
}

export interface OptionsWithStorybook extends OptionsWithFiles {
  /**
   * The storybook configuration directory.
   *
   * @default '.storybook'
   */
  storybookDirectory?: string;
}

export interface OptionsWithTailwind extends OptionsOverrides {
  /**
   * Tailwind CSS v4 stylesheet entrypoint, absolute or relative to the project root.
   *
   * When omitted, a `tailwind.config.ts` (preferred) or `tailwind.config.js` is discovered by walking up to the Git
   * root and loaded through Tailwind v4's `@config` directive. When none is found, the Tailwind config is not enabled.
   */
  cssConfigPath?: string;
}
