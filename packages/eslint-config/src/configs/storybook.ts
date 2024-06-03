import { fixupPluginRules } from '@eslint/compat';

import { GLOB_STORIES } from '../globs';
import type {
  OptionsTypeScriptWithTypes,
  OptionsWithStorybook,
  TypedFlatConfigItem,
} from '../types';
import { interopDefault } from '../utils';

export async function storybook(
  options: OptionsWithStorybook & OptionsTypeScriptWithTypes = {},
): Promise<TypedFlatConfigItem[]> {
  const {
    files = [GLOB_STORIES],
    overrides = {},
    parserOptions,
    tsconfigPath,
    storybookDirectory = '.storybook',
  } = options;

  const [storybook, parser] = await Promise.all([
    interopDefault(import('eslint-plugin-storybook')),
    interopDefault(import('@typescript-eslint/parser')),
  ]);

  const languageOptions = {
    parser,
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
      project: tsconfigPath,
      ...(parserOptions as object),
    },
    sourceType: 'module' as const,
  };

  return [
    {
      name: '2digits:storybook/setup',
      plugins: {
        storybook: fixupPluginRules(storybook as never),
      },
    },
    {
      name: '2digits:storybook/rules',
      files,
      languageOptions,
      rules: {
        'storybook/await-interactions': 'error',
        'storybook/context-in-play-function': 'error',
        'storybook/csf-component': 'error',
        'storybook/default-exports': 'error',
        'storybook/hierarchy-separator': 'error',
        'storybook/no-redundant-story-name': 'error',
        'storybook/no-stories-of': 'error',
        'storybook/no-title-property-in-meta': 'error',
        'storybook/prefer-pascal-case': 'error',
        'storybook/story-exports': 'error',
        'storybook/use-storybook-expect': 'error',
        'storybook/use-storybook-testing-library': 'error',

        ...overrides,
      },
    },
    {
      name: '2digits:storybook/disables',
      files,
      rules: {
        'react-hooks/rules-of-hooks': 'off',
        'react/display-name': 'off',
      },
    },
    {
      name: '2digits:storybook/config',
      files: [`${storybookDirectory}/main.@(js|cjs|mjs|ts)`],
      languageOptions,
      rules: {
        'storybook/no-uninstalled-addons': 'error',
      },
    },
  ];
}
