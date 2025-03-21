import plugin from '@eslint/markdown';
import { mergeProcessors, processorPassThrough } from 'eslint-merge-processors';

import { GLOB_MARKDOWN, GLOB_MARKDOWN_IN_MARKDOWN } from '../globs';
import type { TypedFlatConfigItem } from '../types';

const files = [GLOB_MARKDOWN];

export function markdown(): TypedFlatConfigItem[] {
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
      languageOptions: {
        parser: parserPlain,
      },
    },
    {
      name: '2digits:markdown/rules',
      files,
      rules: {
        ...Object.fromEntries(plugin.configs.recommended.flatMap(({ rules }) => Object.entries(rules))),
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
