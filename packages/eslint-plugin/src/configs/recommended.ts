import type { Rules } from 'eslint-define-config';

import type Rule from '../rules';
import { defineConfig } from '../utils';

export default defineConfig({
  plugins: ['@2digits'],
  rules: {
    '@2digits/type-param-names': 'error',
  } satisfies Record<`@2digits/${keyof typeof Rule}`, Rules[string]>,
});
