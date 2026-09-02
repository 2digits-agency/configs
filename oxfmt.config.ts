import fmt from '@2digits/oxfmt-config';

export default fmt({
  ignorePatterns: ['packages/**/_fixtures/**', 'packages/eslint-config/src/types.gen.d.ts', '.tegami/*.md'],
});
