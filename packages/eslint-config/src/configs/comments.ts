import { pluginComments } from '../plugins';
import type { TypedFlatConfigItem } from '../types';

export function comments(): TypedFlatConfigItem[] {
  return [
    {
      name: '2digits:comments',
      plugins: {
        'eslint-comments': pluginComments,
      },
      rules: {
        'eslint-comments/no-aggregating-enable': 'error',
        'eslint-comments/no-duplicate-disable': 'error',
        'eslint-comments/no-unlimited-disable': 'error',
        'eslint-comments/no-unused-enable': 'error',
        'eslint-comments/no-unused-disable': 'error',
      },
    },
  ];
}
