import type { OxlintConfig } from 'oxlint';

import { ignorePatterns } from '@2digits/constants';

/**
 * Root settings shared by the base and TypeScript presets: every rule is opted into explicitly, and any reported or
 * unused suppression fails the run.
 */
export const presetConfig = {
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
  ignorePatterns,
} satisfies OxlintConfig;
