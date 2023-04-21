import type { Rules } from 'eslint-define-config';

export const react = {
  'react/prop-types': ['off'],
  'react/react-in-jsx-scope': ['off'],
  'react/jsx-newline': [
    'error',
    {
      prevent: false,
    },
  ],
} satisfies Rules;
