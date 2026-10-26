export default {
  jsPlugins: [
    {
      name: 'boolean',
      specifier: import.meta.resolve('eslint-plugin-de-morgan'),
    },
  ],
  rules: {
    'boolean/no-negated-conjunction': 'error',
    'boolean/no-negated-disjunction': 'error',
  },
};
