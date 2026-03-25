import { overridesConfig } from './configs/overrides';
import { typeAwareConfig } from './configs/type-aware';
import { typescriptRulesConfig } from './configs/typescript';
import { vitestConfig } from './configs/vitest';
import { ignorePatterns } from './globs';
import { defineTypedConfig } from './types';

export const typescriptConfig = defineTypedConfig({
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
  extends: [typescriptRulesConfig, typeAwareConfig, vitestConfig, overridesConfig],
  ignorePatterns: [...ignorePatterns],
});
