import type { FlatConfigItem } from 'oxlint-flat-config';

import { GLOB_TS, GLOB_TSX } from '../globs';
import type { OptionsWithFiles } from '../types';

export function reactWeb(options: OptionsWithFiles = {}): Array<FlatConfigItem> {
  const { files = [GLOB_TS, GLOB_TSX], overrides = {} } = options;

  return [
    {
      name: '2digits:react/web',
      files,
      rules: {
        'jsx-a11y/alt-text': 'error',
        'jsx-a11y/aria-props': 'error',
        'jsx-a11y/aria-proptypes': 'error',
        'jsx-a11y/aria-role': 'error',
        'jsx-a11y/aria-unsupported-elements': 'error',
        'jsx-a11y/click-events-have-key-events': 'error',
        'jsx-a11y/html-has-lang': 'error',
        'jsx-a11y/iframe-has-title': 'error',
        'jsx-a11y/label-has-associated-control': 'error',
        'jsx-a11y/no-aria-hidden-on-focusable': 'error',
        'jsx-a11y/no-noninteractive-element-interactions': 'error',
        'jsx-a11y/no-static-element-interactions': 'error',
        'jsx-a11y/role-has-required-aria-props': 'error',
        'jsx-a11y/role-supports-aria-props': 'error',
        'jsx-a11y/tabindex-no-positive': 'error',
        'react/no-unknown-property': ['error', { ignore: ['cmdk-input-wrapper'] }],

        ...overrides,
      },
    },
  ];
}
