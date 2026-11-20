import type { FlatConfigItem } from 'oxlint-flat-config';

import type { OptionsOverrides } from '../types';

/**
 * Alchemy Domain checks that only apply to projects that host a `@alchemy.run/domain` model.
 *
 * @param options Rule overrides.
 */
export function alchemy(options: OptionsOverrides = {}): Array<FlatConfigItem> {
  const { overrides = {} } = options;

  return [
    {
      name: '2digits:alchemy',
      rules: {
        '2digits/alchemy-domain-stack-providers': 'error',

        ...overrides,
      },
    },
  ];
}
