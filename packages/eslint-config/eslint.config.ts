import { twoDigits } from '@2digits/eslint-config';

export default twoDigits({
  ts: { tsconfigRootDir: import.meta.dirname },
  ignores: { ignores: ['**/fixtures/**'] },
});
