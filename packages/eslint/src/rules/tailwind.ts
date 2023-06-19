import { findUpSync } from 'find-up';

import { tailwindFunctions } from '@2digits/constants';

import { defineConfig } from '../utils';

const tailwindConfig = findUpSync(['tailwind.config.ts', 'tailwind.config.js']);

export const tailwind = defineConfig({
  extends: ['plugin:tailwindcss/recommended'],
  settings: {
    tailwindcss: {
      callees: tailwindFunctions,
      config: tailwindConfig,
    },
  },
  rules: {
    'tailwindcss/classnames-order': ['off'],
  },
});
