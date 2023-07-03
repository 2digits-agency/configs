import { getPackageInfoSync } from 'local-pkg';

import { defineConfig } from '../utils';

const nextVersion = getPackageInfoSync('next')?.version;

export const next = defineConfig({
  extends: nextVersion ? ['next'] : [],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
});
