import { FlatConfigComposer } from 'eslint-flat-config-utils';

import { ignores, javascript, next, node, react, turbo, typescript } from './configs';
import { twoDigitsConfig } from './eslint.config';
import type { ConfigNames, TypedFlatConfigItem } from './types';

export function twoDigits(): FlatConfigComposer<TypedFlatConfigItem, ConfigNames> {
  let composer = new FlatConfigComposer<TypedFlatConfigItem, ConfigNames>(
    // Base configs
    ignores(),
    turbo(),
    javascript(),
    typescript(),
    react(),
    node(),
    next(),
    twoDigitsConfig(),
  );

  if (false as boolean) {
    composer = composer.append(javascript());
  }

  return composer;
}
