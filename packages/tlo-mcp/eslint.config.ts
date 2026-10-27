import { twoDigits } from '@2digits/eslint-config';

export default twoDigits(
  {
    ts: { tsconfigRootDir: import.meta.dirname },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      'unicorn/throw-new-error': 'off',
      'ts/no-misused-spread': 'off',
      '@2digits/type-param-names': 'off',
    },
  },
);
