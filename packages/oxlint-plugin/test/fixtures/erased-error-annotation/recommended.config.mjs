const specifier = process.env.ERASED_ERROR_PLUGIN ?? '../../../dist/index.mjs';
const { recommendedRules } = await import(specifier);

export default {
  categories: { correctness: 'off' },
  jsPlugins: [{ name: '2digits', specifier }],
  rules: recommendedRules,
};
