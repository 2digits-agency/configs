import { getPackageInfoSync } from 'local-pkg';

import { defineConfig } from '../utils';

const nextVersion = getPackageInfoSync('next')?.version;

export const next = nextVersion
  ? defineConfig({
      extends: ['next'],
      rules: {
        '@next/next/no-html-link-for-pages': 'off',
      },
    })
  : defineConfig({
      extends: [],
      rules: undefined,
    });
