import type { Extends, Rules, Settings } from 'eslint-define-config';
import { isPackageExists } from 'local-pkg';

const reactInProject = isPackageExists('react');

export const rules = (
  reactInProject
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
  reactInProject ? ['plugin:react/recommended', 'plugin:react-hooks/recommended'] : []
) satisfies Extends;

export const settings = {
  react: {
    version: 'detect',
  },
} satisfies Settings;
