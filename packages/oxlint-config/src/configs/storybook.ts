import type { FlatConfigItem } from 'oxlint-flat-config';

import { GLOB_STORIES } from '../globs';
import type { OptionsWithStorybook } from '../types';

export function storybook(options: OptionsWithStorybook = {}): Array<FlatConfigItem> {
  const { files = [GLOB_STORIES], overrides = {}, storybookDirectory = '.storybook' } = options;

  const jsPlugins = [
    {
      name: 'storybook',
      specifier: import.meta.resolve('eslint-plugin-storybook'),
    },
  ];

  return [
    {
      name: '2digits:storybook/rules',
      files,
      jsPlugins,
      rules: {
        'storybook/await-interactions': 'error',
        'storybook/context-in-play-function': 'error',
        'storybook/csf-component': 'error',
        'storybook/default-exports': 'error',
        'storybook/hierarchy-separator': 'error',
        'storybook/meta-inline-properties': 'error',
        'storybook/no-redundant-story-name': 'error',
        'storybook/no-stories-of': 'error',
        'storybook/no-title-property-in-meta': 'error',
        'storybook/no-uninstalled-addons': 'error',
        'storybook/prefer-pascal-case': 'error',
        'storybook/story-exports': 'error',
        'storybook/use-storybook-expect': 'error',
        'storybook/use-storybook-testing-library': 'error',
        'storybook/meta-satisfies-type': 'error',
        'storybook/no-renderer-packages': 'error',

        ...overrides,
      },
    },
    {
      name: '2digits:storybook/disables',
      files,
      rules: {
        'sonar/no-duplicate-string': 'off',
      },
    },
    {
      name: '2digits:storybook/config',
      files: [`${storybookDirectory}/main.{js,cjs,mjs,ts}`],
      jsPlugins,
      rules: {
        'storybook/no-uninstalled-addons': 'error',
      },
    },
  ];
}
