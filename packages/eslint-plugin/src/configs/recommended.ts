import type { Rules } from 'eslint-define-config';

import type { rules } from '../rules';
import { defineConfig } from '../utils';

export const recommended = defineConfig({
  plugins: ['@2digits'],
  rules: {
    '@2digits/type-param-names': 'error',
  } satisfies Record<`@2digits/${keyof typeof rules}`, Rules[string]>,
});
