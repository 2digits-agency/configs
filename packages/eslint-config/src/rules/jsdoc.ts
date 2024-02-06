import { defineConfig } from '../utils';

export const jsdoc = defineConfig({
  extends: ['plugin:jsdoc/recommended-typescript-error'],
  rules: {
    'jsdoc/require-jsdoc': ['error', { require: { FunctionDeclaration: false } }],
    'jsdoc/tag-lines': ['off'],
  },
});
