import { defineConfig } from 'oxlint';

import { overridesConfig } from './configs/overrides';
import { typeAwareConfig } from './configs/type-aware';
import { typescriptRulesConfig } from './configs/typescript';
import { vitestConfig } from './configs/vitest';
import { ignorePatterns } from './globs';

export const typescriptConfig = defineConfig({
  extends: [typescriptRulesConfig, typeAwareConfig, vitestConfig, overridesConfig],
  ignorePatterns: [...ignorePatterns],
});
