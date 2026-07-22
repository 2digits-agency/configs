import { defineConfig } from '@oxlint-types/define-config';

import { commonJsFiles, dtsFiles, testFiles } from '../globs';

export const overridesConfig = defineConfig({
  overrides: [
    {
      files: [...dtsFiles],
      rules: {
        'eslint/no-duplicate-imports': 'off',
        'eslint/no-undef': 'off',
        'eslint/no-unused-vars': 'off',
        'import/unambiguous': 'off',
      },
    },
    {
      files: [...testFiles],
      globals: {
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        bench: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        expectTypeOf: 'readonly',
        it: 'readonly',
        suite: 'readonly',
        test: 'readonly',
        vi: 'readonly',
      },
      rules: {
        'eslint/no-unused-expressions': 'off',
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
