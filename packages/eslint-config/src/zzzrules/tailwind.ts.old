import { findUpSync } from 'find-up';
import { getPackageInfoSync } from 'local-pkg';

import { tailwindFunctions } from '@2digits/constants';

import { defineConfig } from '../utils';

const tailwindConfig = findUpSync(['tailwind.config.ts', 'tailwind.config.js']);

const tailwindVersion = getPackageInfoSync('tailwindcss')?.version;

export const tailwind =
  tailwindVersion && tailwindConfig
    ? defineConfig({
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
      })
    : defineConfig({
        extends: [],
        settings: undefined,
        rules: undefined,
      });
