import { file } from 'bun';

import base from './rules/base.md' with { type: 'file', embed: 'true' };
import effect from './rules/effect.md' with { type: 'file', embed: 'true' };
import react from './rules/react.md' with { type: 'file', embed: 'true' };

const rules = await Promise.all([file(base).text(), file(effect).text(), file(react).text()]);

export function loadRules(): string {
  return rules.join('\n\n');
}
