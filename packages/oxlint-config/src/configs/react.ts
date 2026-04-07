import type { DummyRule } from 'oxlint';

import { defineTypedConfig } from '../types';

export const reactConfig = defineTypedConfig({
  settings: {
    'react-x': {
      version: 'detect',
    },
  },
  options: { typeAware: true },
  plugins: ['react', 'react-perf'],
  jsPlugins: [
    {
      name: 'react-compiler',
      specifier: import.meta.resolve('eslint-plugin-react-compiler'),
    },
    {
      name: 'stylistic',
      specifier: import.meta.resolve('@stylistic/eslint-plugin'),
    },
  ],
  rules: {
    'react/button-has-type': 'error',
    'react/exhaustive-deps': 'error',
    'react/iframe-missing-sandbox': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-comment-textnodes': 'warn',
    'react/jsx-no-constructed-context-values': 'error',
    'react/jsx-no-script-url': 'warn',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-no-useless-fragment': 'off',
    'react/no-array-index-key': 'warn',
    'react/no-children-prop': 'error',
    'react/no-clone-element': 'warn',
    'react/no-danger': 'warn',
    'react/no-danger-with-children': 'error',
    'react/no-did-mount-set-state': 'warn',
    'react/no-direct-mutation-state': 'error',
    'react/no-find-dom-node': 'error',
    'react/no-namespace': 'error',
    'react/no-redundant-should-component-update': 'error',
    'react/no-render-return-value': 'error',
    'react/no-unsafe': 'warn',
    'react/no-will-update-set-state': 'warn',
    'react/rules-of-hooks': 'error',
    'react/self-closing-comp': 'error',
    'react/void-dom-elements-no-children': 'error',
    'react_perf/jsx-no-jsx-as-prop': 'error',
    ...({
      'react-compiler/react-compiler': 'error',
      'stylistic/jsx-curly-newline': 'off',
      'stylistic/jsx-newline': ['error', { prevent: false }],
    } as Record<string, DummyRule>),
  },
});
