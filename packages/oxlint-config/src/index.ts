import { defineConfig, type OxlintConfig } from 'oxlint';

import { baseConfig } from './base';
import { typescriptConfig } from './typescript';

export const twoDigits = defineConfig({
  extends: [baseConfig, typescriptConfig],
});

export function withTwoDigits(...configs: Array<OxlintConfig>) {
  return defineConfig({
    extends: [twoDigits, ...configs],
  });
}

export default twoDigits;
