import { composer } from 'eslint-flat-config-utils';

import { GLOB_EXCLUDE } from '../globs';
import type { OptionsWithIgnores, TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function ignores(options: OptionsWithIgnores = {}): Promise<TypedFlatConfigItem[]> {
  const { gitIgnore, ignores = [] } = options;

  return composer(
    {
      ignores: [GLOB_EXCLUDE, ignores].flat(),
      name: '2digits:ignores',
    },
    interopDefault(import('eslint-config-flat-gitignore')).then((m) => ({
      ...m(gitIgnore),
      name: '2digits:gitignore',
    })),
  );
}
