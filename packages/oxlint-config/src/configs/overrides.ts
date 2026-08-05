import { defineConfig } from 'oxlint';

import { commonJsFiles, dtsFiles, testFiles } from '../globs';

export const overridesConfig = defineConfig({
  overrides: [
    {
      files: [...dtsFiles],
      rules: {
        'no-duplicate-imports': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
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
