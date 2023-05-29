import type { Extends, Rules, Settings } from 'eslint-define-config';
import { getPackageInfoSync } from 'local-pkg';

const reactVersion = getPackageInfoSync('react')?.version;

export const rules = (
  reactVersion
    ? {
        'react/prop-types': ['off'],
        'react/react-in-jsx-scope': ['off'],
        'react/jsx-newline': [
          'error',
          {
            prevent: false,
          },
        ],
      }
    : {}
) satisfies Rules;

export const extendsConfig = (
  reactVersion ? ['plugin:react/recommended', 'plugin:react-hooks/recommended'] : []
) satisfies Extends;

export const settings = (
  reactVersion
    ? {
        react: {
          version: reactVersion,
        },
      }
    : {}
) satisfies Settings;
