import { pluginSonar } from '../plugins';
import type { TypedFlatConfigItem } from '../types';

export function sonar(): TypedFlatConfigItem[] {
  return [
    {
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
        'sonar/no-duplicate-string': ['error', { threshold: 5 }],
      },
    },
  ];
}
