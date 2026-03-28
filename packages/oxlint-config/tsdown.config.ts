import { execFileSync } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import ts from 'dedent';
import type { OxlintConfig } from 'oxlint';
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/base.ts', 'src/typescript.ts'],
  dts: {
    tsgo: true,
  },
  fixedExtension: true,
  exports: true,
  attw: { profile: 'esm-only', level: 'error' },
  publint: { strict: true },
  shims: true,
  hooks(ctx) {
    ctx.hook('build:prepare', async () => {
      const output = execFileSync(
        fileURLToPath(new URL('node_modules/oxlint/bin/oxlint', import.meta.url)),
        ['--rules', '--format', 'json'],
        {
          cwd: new URL('..', import.meta.url),
          encoding: 'utf8',
        },
      );

      const rules = JSON.parse(output) as Array<OxlintRule>;

      const ruleDefinitions = rules.map((element) => toDefinition(element));

      const dts = ts`
/* eslint-disable */
/* prettier-ignore */
import type { DummyRule } from 'oxlint';

export interface RuleOptions {
${ruleDefinitions.join('\n')}
}

export type RuleName = keyof RuleOptions;
`;

      await writeFile(new URL('src/types.gen.d.ts', import.meta.url), dts);
    });
  },
});

function toDefinition(rule: OxlintRule): string {
  const ruleName = `${rule.scope}/${rule.value}`;

  let ruleTitle = rule.value.replaceAll('-', ' ');

  ruleTitle = ruleTitle.charAt(0).toUpperCase() + ruleTitle.slice(1);

  const scope = rule.scope.charAt(0).toUpperCase() + rule.scope.slice(1);
  const category = rule.category.charAt(0).toUpperCase() + rule.category.slice(1);

  const ts = String.raw;

  return ts`
  /**
   * ${ruleTitle}
   *
   * plugin: ${scope}
   * category: ${category}
   * type-aware: ${String(rule.type_aware)}
   *
   * @see ${rule.docs_url}
   */
  '${ruleName}'?: DummyRule;`;
}

type PluginName = Exclude<OxlintConfig['plugins'], undefined>[number];
type PluginCategory = keyof Exclude<OxlintConfig['categories'], undefined>;

interface OxlintRule {
  category: PluginCategory;
  default: boolean;
  docs_url: string;
  scope: PluginName;
  type_aware: boolean;
  value: string;
}
