import type { FlatConfigItem } from 'oxlint-flat-config';

export function depend(): Array<FlatConfigItem> {
  return [
    {
      name: '2digits:depend',
      jsPlugins: [
        {
          name: 'depend',
          specifier: import.meta.resolve('eslint-plugin-depend'),
        },
      ],
      rules: {
        'depend/ban-dependencies': 'warn',
      },
    },
  ];
}
