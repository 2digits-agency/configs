import pluginSonar from 'eslint-plugin-sonarjs';

import { GLOB_SRC } from '../globs';
import type { TypedFlatConfigItem } from '../types';

export function sonar(): TypedFlatConfigItem[] {
  return [
    {
      files: [GLOB_SRC],
      name: '2digits:sonar',
      plugins: {
        sonar: pluginSonar,
      },
      rules: {
        'sonar/code-eval': 'error',
        'sonar/cognitive-complexity': 'error',
        'sonar/comma-or-logical-or-case': 'error',
        'sonar/concise-regex': 'error',
        'sonar/confidential-information-logging': 'error',
        'sonar/constructor-for-side-effects': 'error',
        'sonar/content-length': 'error',
        'sonar/content-security-policy': 'error',
        'sonar/cookie-no-httponly': 'error',
        'sonar/cors': 'error',
        'sonar/csrf': 'error',
        'sonar/max-switch-cases': 'error',
        'sonar/no-all-duplicated-branches': 'error',
        'sonar/no-collapsible-if': 'error',
        'sonar/no-collection-size-mischeck': 'error',
        'sonar/no-duplicate-string': ['error', { threshold: 5 }],
        'sonar/no-duplicated-branches': 'error',
        'sonar/no-element-overwrite': 'error',
        'sonar/no-empty-collection': 'error',
        'sonar/no-extra-arguments': 'error',
        'sonar/no-for-in-iterable': 'error',
        'sonar/no-gratuitous-expressions': 'error',
        'sonar/no-identical-conditions': 'error',
        'sonar/no-identical-expressions': 'error',
        'sonar/no-identical-functions': 'error',
        'sonar/no-ignored-return': 'error',
        'sonar/no-inverted-boolean-check': 'error',
        'sonar/no-nested-switch': 'error',
        'sonar/no-nested-template-literals': 'error',
        'sonar/no-one-iteration-loop': 'error',
        'sonar/no-redundant-boolean': 'error',
        'sonar/no-same-line-conditional': 'error',
        'sonar/no-small-switch': 'error',
        'sonar/no-unused-collection': 'error',
        'sonar/no-use-of-empty-return-value': 'error',
        'sonar/no-useless-catch': 'error',
        'sonar/non-existent-operator': 'error',
        'sonar/prefer-immediate-return': 'error',
        'sonar/prefer-object-literal': 'error',
        'sonar/prefer-single-boolean-return': 'error',
        'sonar/prefer-while': 'error',

        'sonar/elseif-without-else': 'off',
        'sonar/no-redundant-jump': 'off',
      },
    },
  ];
}
