export default {
  jsPlugins: [
    {
      name: '2digits',
      specifier: import.meta.resolve('@2digits/oxlint-plugin'),
    },
  ],
  rules: {
    '2digits/no-empty-schema-struct': 'error',
    '2digits/no-duplicate-fresh-layer-factory': 'error',
  },
};
