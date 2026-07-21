import { describe, expect, it } from 'vite-plus/test';

import { twoDigits } from '../src/config';

const overrides = twoDigits.extends?.flatMap(({ overrides = [] }) => overrides) ?? [];

const javaScriptRules = {
  'eslint/complexity': 'off',
  'jsdoc/check-tag-names': 'off',
  'jsdoc/no-defaults': 'off',
  'typescript/no-unsafe-assignment': 'off',
  'typescript/no-unnecessary-condition': 'off',
  'typescript/prefer-nullish-coalescing': 'off',
  'typescript/require-await': 'off',
  'unicorn/no-null': 'off',
  'unicorn/require-module-specifiers': 'off',
} as const;

describe('javascript overrides', () => {
  it('relaxes type-dependent rules for every JavaScript file', () => {
    const javaScriptOverride = overrides.find(({ files }) => files.includes('**/*.js'));

    expect(javaScriptOverride?.rules).toMatchObject(javaScriptRules);
    expect(javaScriptOverride?.files).not.toContain('**/*.ts');
  });

  it('allows empty module markers in declaration files', () => {
    const declarationOverride = overrides.find(({ files }) => files.includes('**/*.d.ts'));

    expect(declarationOverride?.rules).toMatchObject({
      'unicorn/require-module-specifiers': 'off',
    });
  });
});
