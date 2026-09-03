import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, ruleMeta } from '../../utils';

const nodePathSources = new Set(['node:path', 'path']);

export const preferEffectPath: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer the Effect Path service over direct Node.js path imports in Effect projects.',
    {
      effectPath: 'Use the Path service from effect/Path instead of {{source}}.',
    },
    'https://www.effect.website/docs/v4/api/effect/Path',
  ),
  (context, getState) => ({
    ImportDeclaration(node) {
      if (getState().hasEffectImport && nodePathSources.has(node.source.value)) {
        context.report({ node: node.source, messageId: 'effectPath', data: { source: node.source.value } });
      }
    },
  }),
);
