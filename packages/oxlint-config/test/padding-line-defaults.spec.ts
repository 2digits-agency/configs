import { readFileSync } from 'node:fs';
import path from 'node:path';

import ts from 'dedent';
import { describe, expect, it } from 'vite-plus/test';

import { presetUrl, runOxlint, withTemporaryProject } from './oxlint';

const source = ts`
  import type { Input } from './input.js';
  import type { Output } from './output.js';
  export function filename(value: Input): Output {
    const fullPath = value.path;
    // Keep this comment with the next declaration.
    const name = fullPath.trim();
    return name;
  }
  export const defaultName = filename({ path: ' example ' });
`;

const expectedSource = ts`
  import type { Input } from './input.js';
  import type { Output } from './output.js';

  export function filename(value: Input): Output {
    const fullPath = value.path;

    // Keep this comment with the next declaration.
    const name = fullPath.trim();

    return name;
  }

  export const defaultName = filename({ path: ' example ' });
`;

const projectFiles = {
  'input.ts': ts`export type Input = { readonly path: string };`,
  'output.ts': ts`export type Output = string;`,
  'source.ts': source,
};

const alwaysSpacing = "['error', { blankLine: 'always', prev: '*', next: '*' }]";

const anySpacing = "['error', { blankLine: 'any', prev: '*', next: '*' }]";

/**
 * Source for a consumer config that sets the statement spacing rule.
 *
 * @param entry Rule entry source.
 */
function spacingRule(entry: string) {
  return `{ rules: { '2digits/padding-line-between-statements': ${entry} } }`;
}

describe('default statement spacing', () => {
  it('reports and fixes missing blank lines through the built default preset idempotently', () => {
    const config = ts`
      import lint from '${presetUrl}';

      export default lint();
    `;

    withTemporaryProject({ ...projectFiles, 'oxlint.config.mjs': config }, (directory) => {
      const reported = runOxlint(directory, 'source.ts');

      expect(reported.status, reported.output).toBe(1);

      expect(reported.output).toContain('padding-line-between-statements');

      for (const _pass of [1, 2]) {
        const fixed = runOxlint(directory, '--fix', 'source.ts');

        expect(fixed.status, fixed.output).toBe(0);

        expect(readFileSync(path.join(directory, 'source.ts'), 'utf8')).toBe(expectedSource);
      }
    });
  });

  it.for([
    spacingRule("'off'"),
    spacingRule(anySpacing),
    `{ extends: [${spacingRule("'off'")}] }`,
    `${spacingRule(alwaysSpacing)}, ${spacingRule(anySpacing)}`,
  ])('honors consumer rule configuration: %s', (consumerConfigs) => {
    const config = ts`
      import lint from '${presetUrl}';

      export default lint(${consumerConfigs});
    `;

    withTemporaryProject({ ...projectFiles, 'oxlint.config.mjs': config }, (directory) => {
      const result = runOxlint(directory, '--fix', 'source.ts');

      expect(result.status, result.output).toBe(0);

      expect(readFileSync(path.join(directory, 'source.ts'), 'utf8')).toBe(source);
    });
  });
});
