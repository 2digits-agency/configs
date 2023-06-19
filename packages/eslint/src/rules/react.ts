import { getPackageInfoSync } from 'local-pkg';

import { defineConfig } from '../utils';

const reactVersion = getPackageInfoSync('react')?.version;

export const react = reactVersion
  ? defineConfig({
      extends: ['plugin:react/recommended', 'plugin:react-hooks/recommended'],
      settings: {
        react: {
          version: reactVersion,
        },
      },
      rules: {
        'react/prop-types': ['off'],
        'react/react-in-jsx-scope': ['off'],
        'react/jsx-curly-newline': ['off'],
        'react/jsx-newline': [
          'error',
          {
            prevent: false,
          },
        ],
      },
    })
  : defineConfig({
      extends: [],
      settings: undefined,
      rules: undefined,
    });
