import { twoDigits } from '@2digits/oxlint-config';

export default {
  ...twoDigits,
  ignorePatterns: [],
  // The authored JS fixtures exercise syntax rules, not project type resolution.
  options: { ...twoDigits.options, typeAware: false, typeCheck: false },
};
