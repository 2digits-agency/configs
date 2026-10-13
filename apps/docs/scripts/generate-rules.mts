import { mkdir, rm, writeFile } from 'node:fs/promises';

import eslint from '@2digits/eslint-plugin';
import { recommendedRules, rules as oxlintRules } from '@2digits/oxlint-plugin';

type Rule = (typeof eslint.rules)[keyof typeof eslint.rules] | (typeof oxlintRules)[keyof typeof oxlintRules];

const root = new URL('../content/docs/rules/', import.meta.url);

// This directory contains only generated references, never authored guides.
await rm(root, { recursive: true, force: true });

await mkdir(root, { recursive: true });

await writeFile(new URL('meta.json', root), JSON.stringify({ title: 'Rule reference', pages: ['eslint', 'oxlint'] }));

await generate('eslint', '@2digits', eslint.rules, eslint.configs.recommended.rules);

await generate('oxlint', '2digits', oxlintRules, recommendedRules);

async function generate(
  engine: 'eslint' | 'oxlint',
  prefix: string,
  rules: Record<string, Rule>,
  recommended: Record<string, unknown>,
) {
  const dir = new URL(`${engine}/`, root);

  await mkdir(dir, { recursive: true });

  const entries = Object.entries(rules).toSorted(([a], [b]) => a.localeCompare(b));

  const names = entries.map(([name]) => name);

  const title = engine === 'eslint' ? 'ESLint' : 'Oxlint';

  await writeFile(new URL('meta.json', dir), JSON.stringify({ title: `${title} rules`, pages: ['index', ...names] }));

  const rows = await Promise.all(
    entries.map(async ([name, rule]) => {
      const enabled = `${prefix}/${name}` in recommended;

      await writeFile(new URL(`${name}.mdx`, dir), renderRule(engine, prefix, name, rule, enabled));

      const description = (rule.meta?.docs?.description ?? name).replaceAll(/[\\`*_[\]<>|{}]/g, String.raw`\$&`);

      return `| [\`${name}\`](/docs/rules/${engine}/${name}) | ${description} | ${enabled ? 'Yes' : 'Opt-in'} |`;
    }),
  );

  await writeFile(
    new URL('index.mdx', dir),
    `---
title: ${title} rules
description: All ${names.length} registered custom rules in @2digits/${engine}-plugin.
---

Generated from the plugin registry. Preset membership comes from the exported recommended configuration, not descriptive metadata.

| Rule | Description | Recommended |
| --- | --- | --- |
${rows.join('\n')}
`,
  );

  console.log(`Generated ${names.length} ${engine} rule references.`);
}

function renderRule(
  engine: 'eslint' | 'oxlint',
  prefix: string,
  name: string,
  { meta = {} }: Rule,
  enabled: boolean,
): string {
  const id = `${prefix}/${name}`;

  const sourcePath =
    engine === 'oxlint' && name !== 'padding-line-between-statements'
      ? `${name.startsWith('alchemy-') ? 'alchemy' : 'effect'}/${name}`
      : name;

  const sourceUrl = `https://github.com/2digits-agency/configs/blob/main/packages/${engine}-plugin/src/rules/${sourcePath}.ts`;

  const options = JSON.stringify(meta.schema ?? [], undefined, 2);

  const messages = Object.entries(meta.messages ?? {})
    .map(([key, value]) => `### ${key}\n\n\`\`\`text\n${value}\n\`\`\``)
    .join('\n\n');

  const description = meta.docs?.description ?? id;

  const backgroundUrl = meta.docs?.url;

  const background =
    backgroundUrl && backgroundUrl !== sourceUrl ? `- [Background documentation](${backgroundUrl})\n` : '';

  return `---
title: ${JSON.stringify(name)}
description: ${JSON.stringify(description)}
---

This reference is generated from the plugin's registered rule metadata.

| Property | Value |
| --- | --- |
| Rule ID | \`${id}\` |
| Recommended preset | ${enabled ? 'Enabled at error level' : 'Opt-in'} |
| Automatic fix | ${meta.fixable ? `Yes (${meta.fixable})` : 'No'} |
| Editor suggestions | ${meta.hasSuggestions ? 'Yes' : 'No'} |

## Configuration

Add this entry to your registered plugin's \`rules\` configuration:

\`\`\`json
{ "${id}": "error" }
\`\`\`

${name === 'padding-line-between-statements' ? 'This rule needs spacing policies in its options to report diagnostics. The shared Oxlint config supplies a policy; the plugin recommended preset alone does not. See the [plugin guide](/docs/plugins/oxlint#statement-spacing).\n\n' : ''}See the [${engine === 'eslint' ? 'ESLint' : 'Oxlint'} plugin guide](/docs/plugins/${engine}) for registration and usage.

## Options schema

${options === '[]' ? 'This rule accepts no options.' : `The following JSON Schema describes the accepted rule options.\n\n\`\`\`json\n${options}\n\`\`\``}

## Diagnostics

${messages || 'See the implementation for diagnostics.'}

## Implementation and background

- [Rule implementation](${sourceUrl})
${background}`;
}
