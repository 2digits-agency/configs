export default {
  categories: { correctness: 'off' },
  jsPlugins: [{ name: '2digits', specifier: process.env.ERASED_ERROR_PLUGIN ?? '../../../dist/index.mjs' }],
  rules: { '2digits/no-erased-error-annotation': 'warn' },
};
