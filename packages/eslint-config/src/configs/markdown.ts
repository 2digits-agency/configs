import plugin from '@eslint/markdown';
import { renamePluginsInRules } from 'eslint-flat-config-utils';
import { mergeProcessors, processorPassThrough } from 'eslint-merge-processors';

import { PluginNameMap } from '../constants';
import { GLOB_MARKDOWN, GLOB_MARKDOWN_CODE, GLOB_MARKDOWN_IN_MARKDOWN } from '../globs';
import type { TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

const files = [GLOB_MARKDOWN];

export function markdown(): Array<TypedFlatConfigItem> {
  return [
    {
      name: '2digits:markdown/setup',
      plugins: {
        markdown: plugin,
      },
    },
    {
      name: '2digits:markdown/processor',
      files,
      language: 'markdown/gfm',
      ignores: [GLOB_MARKDOWN_IN_MARKDOWN],
      /**
       * `eslint-plugin-markdown` only creates virtual files for code blocks, but not the markdown file itself. We use
       * `eslint-merge-processors` to add a pass-through processor for the markdown file itself.
       */
      processor: mergeProcessors([plugin.processors.markdown, processorPassThrough]),
    },
    {
      name: '2digits:markdown/parser',
      files,
      language: 'markdown/gfm',
      languageOptions: {
        parser: parserPlain,
      },
    },
    {
      name: '2digits:markdown/rules',
      files,
      language: 'markdown/gfm',
      rules: {
        'markdown/fenced-code-language': 'error',
        'markdown/heading-increment': 'error',
        'markdown/no-empty-links': 'error',
        'markdown/no-invalid-label-refs': 'error',
        'markdown/no-missing-label-refs': 'error',
      },
    },
  ];
}

export async function markdownDisables(): Promise<Array<TypedFlatConfigItem>> {
  const tseslint = await interopDefault(import('typescript-eslint'));
  const reactPlugin = await interopDefault(import('@eslint-react/eslint-plugin'));

  const disableTypeCheckedRules = renamePluginsInRules(
    {
      ...tseslint.configs.disableTypeChecked.rules,
      ...reactPlugin.configs['disable-type-checked'].rules,
    },
    PluginNameMap,
  );

  return [
    {
      name: '2digits:markdown/disables',
      files: [GLOB_MARKDOWN_CODE],
      languageOptions: {
        parser: tseslint.parser,
        parserOptions: {
          project: false,
          projectService: false,
          ecmaFeatures: {
            impliedStrict: true,
          },
        },
      },
      rules: {
        ...disableTypeCheckedRules,

        'no-alert': 'off',
        'no-console': 'off',
        'no-labels': 'off',
        'no-lone-blocks': 'off',
        'no-restricted-syntax': 'off',
        'no-undef': 'off',
        'no-unused-expressions': 'off',
        'no-unused-labels': 'off',
        'no-unused-vars': 'off',
        'node/prefer-global/process': 'off',
        'ts/consistent-type-imports': 'off',
        'ts/explicit-function-return-type': 'off',
        'ts/no-namespace': 'off',
        'ts/no-redeclare': 'off',
        'ts/no-require-imports': 'off',
        'ts/no-unused-expressions': 'off',
        'ts/no-unused-vars': 'off',
        'ts/no-use-before-define': 'off',
        'unicode-bom': 'off',
      },
    },
  ];
}

const parserPlain = {
  meta: {
    name: 'parser-plain',
  },
  parseForESLint: (code: string) => ({
    ast: {
      body: [],
      comments: [],
      loc: { end: code.length, start: 0 },
      range: [0, code.length],
      tokens: [],
      type: 'Program',
    },
    // eslint-disable-next-line unicorn/no-null
    scopeManager: null,
    services: { isPlain: true },
    visitorKeys: {
      Program: [],
    },
  }),
};
