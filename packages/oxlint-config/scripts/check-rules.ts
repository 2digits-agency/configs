import { execFileSync } from 'node:child_process';

import { baseConfig } from '../src/base';
import { typescriptConfig } from '../src/typescript';

interface OxlintRule {
  scope: string;
  value: string;
}

const configs = [
  { config: baseConfig, name: 'base' },
  { config: typescriptConfig, name: 'typescript' },
] as const;

const output = execFileSync('pnpm', ['exec', 'oxlint', '--rules', '--format=json'], {
  cwd: new URL('..', import.meta.url),
  encoding: 'utf8',
});

const rules = JSON.parse(output) as Array<OxlintRule>;

const availableRuleNames = new Set(rules.map((rule) => `${rule.scope}/${rule.value}`));
const availableBareRuleNames = new Set(rules.filter((rule) => rule.scope === 'eslint').map((rule) => rule.value));

let hasInvalidRules = false;

for (const { config, name } of configs) {
  const invalidRules = Object.keys(config.rules ?? {}).filter((ruleName) => {
    if (availableRuleNames.has(ruleName)) {
      return false;
    }

    if (!ruleName.includes('/')) {
      return !availableBareRuleNames.has(ruleName);
    }

    return true;
  });

  if (invalidRules.length === 0) {
    console.log(`✅ ${name}: all configured rules exist`);
    continue;
  }

  hasInvalidRules = true;
  console.error(`❌ ${name}: invalid rule names -> ${invalidRules.join(', ')}`);
}

if (hasInvalidRules) {
  process.exit(1);
}
