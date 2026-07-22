import { defineConfig } from '@oxlint-types/define-config';

import { ignorePatterns } from '@2digits/constants';

import { overridesConfig } from './configs/overrides';
import { reactConfig } from './configs/react';
import { typescriptRulesConfig } from './configs/typescript';
import { vitestConfig } from './configs/vitest';

export const typescriptConfig = defineConfig({
  options: {
    denyWarnings: true,
    reportUnusedDisableDirectives: 'deny',
  },
  categories: {
    nursery: 'off',
    pedantic: 'off',
    correctness: 'off',
    perf: 'off',
    style: 'off',
    restriction: 'off',
    suspicious: 'off',
  },
  extends: [typescriptRulesConfig, vitestConfig, reactConfig, overridesConfig],
  ignorePatterns,
});
