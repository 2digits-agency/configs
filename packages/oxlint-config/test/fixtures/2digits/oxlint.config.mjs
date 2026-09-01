export default {
  lint: {
    jsPlugins: [
      {
        name: '2digits',
        specifier: import.meta.resolve('@2digits/oxlint-plugin'),
      },
    ],
    rules: {
      '2digits/no-empty-schema-struct': 'error',
    },
  },
};
