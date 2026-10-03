import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as Schema from 'effect/Schema';
import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules, rules } from '../src';
import { noAmbiguousTemplateLiteralCaptures } from '../src/rules/effect/no-ambiguous-template-literal-captures';

describe('template literal capture policy', () => {
  it('registers the diagnostic without recommending it', () => {
    expect(rules['no-ambiguous-template-literal-captures']).toBe(noAmbiguousTemplateLiteralCaptures);
    expect(recommendedRules['2digits/no-ambiguous-template-literal-captures']).toBeUndefined();
    expect(noAmbiguousTemplateLiteralCaptures.meta?.docs?.recommended).toBeFalsy();
    expect(noAmbiguousTemplateLiteralCaptures.meta?.fixable).toBeUndefined();
  });

  it('demonstrates extraction versus whole-string validation with independent runtime controls', () => {
    const pair = Schema.TemplateLiteralParser([Schema.String, Schema.String]);
    const delimited = Schema.TemplateLiteralParser([Schema.String, '-', Schema.String]);

    expect(Schema.decodeUnknownSync(pair)('helloworld')).toStrictEqual(['helloworld', '']);
    expect(Schema.decodeUnknownSync(delimited)('hello-world')).toStrictEqual(['hello', '-', 'world']);
    expect(Schema.is(pair)(['helloworld', ''])).toBeTruthy();
    expect(Schema.is(Schema.TemplateLiteral([Schema.String, Schema.String]))('helloworld')).toBeTruthy();
    const [first] = Schema.decodeUnknownSync(pair)('helloworld');

    expect(first).toBe('helloworld');
  });

  it('requires explicit enablement in a real oxlint config and leaves intentional uses clean', () => {
    const directory = mkdtempSync(path.join(tmpdir(), '2digits-template-captures-'));
    const binary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));
    const plugin = fileURLToPath(new URL('../dist/index.mjs', import.meta.url));
    const config = path.join(directory, 'oxlint.json');
    const input = path.join(directory, 'input.ts');
    const source = `import * as Schema from 'effect/Schema';
      const Pair = Schema.TemplateLiteralParser([Schema.String, Schema.String]);
      export function parse(input) { return Schema.decodeUnknownSync(Pair)(input); }`;

    function lint(configuredRules: typeof recommendedRules, code: string) {
      writeFileSync(input, code);
      writeFileSync(
        config,
        JSON.stringify({
          categories: { correctness: 'off' },
          jsPlugins: [{ name: '2digits', specifier: plugin }],
          rules: configuredRules,
        }),
      );

      return spawnSync(process.execPath, [binary, '--config', config, input], { encoding: 'utf8' });
    }
    try {
      const recommended = lint(recommendedRules, source);

      expect(recommended.status, `${recommended.stdout}${recommended.stderr}`).toBe(0);
      const explicitRules = { ...recommendedRules, '2digits/no-ambiguous-template-literal-captures': 'error' } as const;
      const enabled = lint(explicitRules, source);

      expect(enabled.status).toBe(1);
      expect(`${enabled.stdout}${enabled.stderr}`).toContain('2digits(no-ambiguous-template-literal-captures)');
      const intentional = lint(
        explicitRules,
        `import * as Schema from 'effect/Schema';
        const Pair = Schema.TemplateLiteralParser([Schema.String, Schema.String]);
        export const validate = Schema.is(Pair);
        export function first(input) { const [value, _ignored] = Schema.decodeUnknownSync(Pair)(input); return value; }
        export function split(input) {
          return Schema.decodeUnknownSync(Schema.TemplateLiteralParser([Schema.String, '-', Schema.String]))(input);
        }`,
      );

      expect(intentional.status, `${intentional.stdout}${intentional.stderr}`).toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
