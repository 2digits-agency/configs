import { defineConfig } from 'oxlint';

import { commonJsFiles, dtsFiles, testFiles } from '../globs';

export const overridesConfig = defineConfig({
  overrides: [
    {
      files: [...dtsFiles],
      rules: {
        'no-duplicate-imports': 'off',
        'no-unused-vars': 'off',
      },
    },
    {
      files: [...testFiles],
      rules: {
        'no-unused-expressions': 'off',
      },
    },
    {
      files: [...commonJsFiles],
      rules: {
        'typescript/no-import-type-side-effects': 'off',
      },
    },
  ],
});
