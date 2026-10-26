import { globalIgnores, type FlatConfigItem } from 'oxlint-flat-config';

import { ignorePatterns } from '@2digits/constants';

import type { OptionsWithIgnores } from '../types';

export function ignores(options: OptionsWithIgnores = {}): Array<FlatConfigItem> {
  const { ignores = [] } = options;

  return [globalIgnores([...ignorePatterns, ...ignores], '2digits:ignores')];
}
