export default {
  jsPlugins: [
    {
      name: '2digits',
      specifier: import.meta.resolve('@2digits/oxlint-plugin'),
    },
  ],
  rules: {
    '2digits/no-empty-schema-struct': 'error',
    '2digits/no-json-boundary-type-assertion': 'error',
  },
};
