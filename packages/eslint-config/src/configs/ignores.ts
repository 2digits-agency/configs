import type { FlatGitignoreOptions } from 'eslint-config-flat-gitignore';
import { composer } from 'eslint-flat-config-utils';

import { GLOB_EXCLUDE } from '../globs';
import type { TypedFlatConfigItem } from '../types';
import { interopDefault } from '../utils';

export async function ignores(options: FlatGitignoreOptions = {}): Promise<TypedFlatConfigItem[]> {
  return composer(
    {
      ignores: GLOB_EXCLUDE,
      name: '2digits:ignores',
    },
    interopDefault(import('eslint-config-flat-gitignore')).then((m) => ({
      ...m(options),
      name: '2digits:gitignore',
    })),
  );
}
