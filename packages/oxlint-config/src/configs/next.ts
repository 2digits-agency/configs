import type { FlatConfigItem } from 'oxlint-flat-config';

import { GLOB_TS, GLOB_TSX } from '../globs';
import type { OptionsWithFiles } from '../types';

/**
 * The Next.js recommended and Core Web Vitals rules, using Oxlint's native `nextjs` plugin for every rule it
 * implements.
 *
 * @param options Files to lint and rule overrides.
 */
export function next(options: OptionsWithFiles = {}): Array<FlatConfigItem> {
  const { files = [GLOB_TS, GLOB_TSX], overrides = {} } = options;

  return [
    {
      name: '2digits:next/rules',
      files,
      jsPlugins: [
        {
          name: 'next',
          specifier: import.meta.resolve('@next/eslint-plugin-next'),
        },
      ],
      rules: {
        'nextjs/google-font-display': 'warn',
        'nextjs/google-font-preconnect': 'warn',
        'nextjs/inline-script-id': 'error',
        'nextjs/next-script-for-ga': 'warn',
        'nextjs/no-assign-module-variable': 'error',
        'nextjs/no-async-client-component': 'warn',
        'nextjs/no-before-interactive-script-outside-document': 'warn',
        'nextjs/no-css-tags': 'warn',
        'nextjs/no-document-import-in-page': 'error',
        'nextjs/no-duplicate-head': 'error',
        'nextjs/no-head-element': 'warn',
        'nextjs/no-head-import-in-document': 'error',
        'nextjs/no-html-link-for-pages': 'off',
        'nextjs/no-img-element': 'warn',
        'nextjs/no-page-custom-font': 'warn',
        'nextjs/no-script-component-in-head': 'error',
        'nextjs/no-styled-jsx-in-document': 'warn',
        'nextjs/no-sync-scripts': 'error',
        'nextjs/no-title-in-document-head': 'warn',
        'nextjs/no-typos': 'warn',
        'nextjs/no-unwanted-polyfillio': 'warn',

        // Oxlint has no native version of this rule.
        'next/no-location-assign-relative-destination': 'warn',

        ...overrides,
      },
    },
    {
      name: '2digits:next/proxy',
      files: ['**/middleware.ts', '**/proxy.ts'],
      rules: {
        'unicorn/prefer-string-raw': 'off',
      },
    },
  ];
}
