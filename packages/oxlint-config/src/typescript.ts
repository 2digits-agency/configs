import { defineConfig } from 'oxlint';

import { overridesConfig } from './configs/overrides';
import { presetConfig } from './configs/preset';
import { reactConfig } from './configs/react';
import { typescriptRulesConfig } from './configs/typescript';
import { vitestConfig } from './configs/vitest';

export const typescriptConfig = defineConfig({
  ...presetConfig,
  extends: [typescriptRulesConfig, vitestConfig, reactConfig, overridesConfig],
});
