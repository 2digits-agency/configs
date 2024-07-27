import type { ParserOptions } from '@typescript-eslint/parser';
import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import type { Linter } from 'eslint';
import type { FlatGitignoreOptions } from 'eslint-config-flat-gitignore';

import type { RuleOptions } from './types.gen';

export type { ConfigNames } from './types.gen';

export type Rules = RuleOptions;

export interface TypedFlatConfigItem
  extends Omit<Linter.Config<Linter.RulesRecord & Rules>, 'plugins' | 'languageOptions'> {
  // Relax plugins type limitation, as most of the plugins did not have correct type info yet.
  /**
   * An object containing a name-value mapping of plugin names to plugin objects. When `files` is
   * specified, these plugins are only available to the matching files.
   *
   * @see [Using plugins in your configuration](https://eslint.org/docs/latest/user-guide/configuring/configuration-files-new#using-plugins-in-your-configuration)
   */
  // eslint-disable-next-line ts/no-explicit-any
  plugins?: Record<string, any>;

  languageOptions?: FlatConfig.LanguageOptions;
}

export interface OptionsOverrides {
  overrides?: TypedFlatConfigItem['rules'];
}

export interface OptionsTypeScriptWithTypes extends OptionsOverrides {
  /**
   * When this options is provided, type aware rules will be enabled.
   *
   * @default true
   * @see https://typescript-eslint.io/linting/typed-linting/
   */
  tsconfigPath?: string | string[] | true;

  /**
   * Root directory of the project.
   *
   * @default process.cwd()
   */
  tsconfigRootDir?: string;

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

export interface OptionsWithReact extends OptionsWithFiles {
  /**
   * Enable the react-compiler plugin.
   *
   * @default true
   */
  reactCompiler?: boolean;
}

export interface OptionsWithIgnores {
  /** Options to pass to eslint-config-flat-gitignore */
  gitIgnore?: Omit<FlatGitignoreOptions, 'name' | 'root'>;

  /** An array of glob patterns to ignore in addition to the default ignores. */
  ignores?: string[];
}
