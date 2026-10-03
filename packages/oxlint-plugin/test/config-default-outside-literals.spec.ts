import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules as builtRecommendedRules } from '../dist/index.mjs';
import { recommendedRules, rules } from '../src';

const ruleName = '2digits/config-default-outside-literals';
const pluginPath = fileURLToPath(new URL('../dist/index.mjs', import.meta.url));
const binary = fileURLToPath(new URL('../node_modules/oxlint/bin/oxlint', import.meta.url));

describe('config-default-outside-literals registration', () => {
  it('registers a diagnostic-only opt-in rule', () => {
    expect(rules['config-default-outside-literals']).toBeDefined();
    expect(recommendedRules).not.toHaveProperty(ruleName);
    expect(rules['config-default-outside-literals'].meta?.docs).toMatchObject({ recommended: false });
    expect(rules['config-default-outside-literals'].meta?.fixable).toBeUndefined();
  });

  it.for([
    { name: 'recommended', ruleSettings: builtRecommendedRules, diagnostics: [] },
    {
      name: 'opt-in',
      ruleSettings: { [ruleName]: 'warn' },
      diagnostics: [
        {
          code: '2digits(config-default-outside-literals)',
          severity: 'warning',
          message:
            'Check this Config default: it is outside the inline allowed values ("debug", "info"). Widening may be intentional.',
        },
      ],
    },
  ])('executes the built plugin with $name rules', ({ ruleSettings, diagnostics }) => {
    const directory = mkdtempSync(path.join(tmpdir(), 'config-default-'));

    try {
      writeFileSync(
        path.join(directory, 'oxlint.json'),
        JSON.stringify({
          categories: { correctness: 'off' },
          jsPlugins: [{ name: '2digits', specifier: pluginPath }],
          rules: ruleSettings,
        }),
      );
      writeFileSync(
        path.join(directory, 'example.ts'),
        `
        import * as Config from 'effect/Config';
        Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'));
        Config.Literals(['debug', 'info']).pipe(Config.withDefault('info'));
        Config.Literals(['debug', 'info']).pipe(Config.withDefault(null));
        const level: Config.Config<'debug' | 'info' | 'inof'> = Config.Literals(['debug', 'info']).pipe(Config.withDefault('inof'));
        // oxlint-disable-next-line 2digits/config-default-outside-literals -- Intentional legacy fallback.
        Config.Literals(['debug', 'info']).pipe(Config.withDefault('legacy'));
      `,
      );
      const result = spawnSync(process.execPath, [binary, '--config=oxlint.json', '--format=json', 'example.ts'], {
        cwd: directory,
        encoding: 'utf8',
      });

      expect(result.stderr).toBe('');
      expect(result.stdout).toContain('"diagnostics"');
      const output = JSON.parse(result.stdout) as {
        diagnostics: Array<{ code: string; severity: string; message: string }>;
      };

      expect(output.diagnostics).toMatchObject(diagnostics);
      expect(output.diagnostics).toHaveLength(diagnostics.length);
      expect(result.status).toBe(0);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
