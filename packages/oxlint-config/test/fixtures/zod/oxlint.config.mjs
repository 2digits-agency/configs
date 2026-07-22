export default {
  lint: {
    jsPlugins: [
      {
        name: 'zod',
        specifier: import.meta.resolve('eslint-plugin-zod'),
      },
    ],
    rules: {
      'zod/array-style': ['error', { style: 'function' }],
    },
  },
};
