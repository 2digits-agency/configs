import type { Rule } from '@oxlint/plugins';

import { canonicalPath, defineEffectRule, ruleMeta } from '../../utils';

export const alchemyNoRemovedConfigApi: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow removed Alchemy Secret and Variable APIs.',
    {
      removed:
        'Alchemy.{{api}} was removed. Use effect/Config (Config.redacted for secrets, Config.string for variables).',
    },
    'https://alchemy.run/blog/2026-05-29-beta-45',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const path = canonicalPath(node.callee, getState());

      if (path?.[0] === 'Alchemy' && (path[1] === 'Secret' || path[1] === 'Variable')) {
        context.report({ node: node.callee, messageId: 'removed', data: { api: path[1] } });
      }
    },
  }),
);
