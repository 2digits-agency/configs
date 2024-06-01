import type { ParserOptions } from '@typescript-eslint/parser';
import type { Linter } from 'eslint';

import type { PluginNameMap } from './constants';
import type { RuleOptions } from './types.gen';

export type { ConfigNames } from './types.gen';

export type Rules = RuleOptions;

export interface TypedFlatConfigItem extends Omit<Linter.FlatConfig, 'plugins' | 'rules'> {
  // Relax plugins type limitation, as most of the plugins did not have correct type info yet.
  /**
   * An object containing a name-value mapping of plugin names to plugin objects. When `files` is
   * specified, these plugins are only available to the matching files.
   *
   * @see [Using plugins in your configuration](https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new#using-plugins-in-your-configuration)
   */
  // eslint-disable-next-line ts/no-explicit-any
  plugins?: Partial<Record<(typeof PluginNameMap)[keyof typeof PluginNameMap], any>>;

  rules?: Rules;
}

export interface OptionsOverrides {
  overrides?: TypedFlatConfigItem['rules'];
}

export interface OptionsTypeScriptWithTypes extends OptionsOverrides {
  /**
   * When this options is provided, type aware rules will be enabled.
   *
   * @see https://typescript-eslint.io/linting/typed-linting/
   */
  tsconfigPath?: string | string[];

  /** Additional parser options for TypeScript. */
  parserOptions?: Partial<ParserOptions>;
}

export interface OptionsWithFiles extends OptionsOverrides {
  /** An array of glob patterns to match the files to which this configuration applies. */
  files?: string[];
}

export interface OptionsWithStorybook extends OptionsWithFiles {
  /**
   * The storybook configuration directory
   *
   * @default '.storybook'
   */
  storybookDirectory?: string;
}
