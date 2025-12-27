import type { Linter } from 'eslint';

import type { rules } from '../rules';

export const recommended = {
  rules: {
    '@2digits/if-curly': 'error' as const,
    '@2digits/prefer-inline-handlers': 'error' as const,
    '@2digits/type-param-names': 'error' as const,
  } satisfies Record<`@2digits/${keyof typeof rules}`, Linter.RuleEntry<[]>>,
};
