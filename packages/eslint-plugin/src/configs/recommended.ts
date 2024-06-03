import type { Linter } from 'eslint';

import type { rules } from '../rules';

export const recommended = {
  rules: {
    '@2digits/type-param-names': 'error' as const,
  } satisfies Record<`@2digits/${keyof typeof rules}`, Linter.RuleEntry<[]>>,
};
