import type { FlatConfigItem } from 'oxlint-flat-config';

export function antfu(): Array<FlatConfigItem> {
  return [
    {
      name: '2digits:antfu',
      jsPlugins: [
        {
          name: 'antfu',
          specifier: import.meta.resolve('eslint-plugin-antfu'),
        },
      ],
      rules: {
        'antfu/top-level-function': 'error',
      },
    },
  ];
}
