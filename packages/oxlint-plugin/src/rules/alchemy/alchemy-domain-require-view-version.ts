import type { Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, objectProperty, ruleMeta } from '../../utils';
import { domainBlock } from './domain';

export const alchemyDomainRequireViewVersion: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Require Alchemy Domain views to declare their version.',
    {
      missing:
        'Declare `version` on this view (`version: 0` keeps the current default). Bump it whenever `evolve`, `emit`, `keyOf`, `state` or `from` changes, so the deploy rebuilds the view from its events.',
    },
    'https://alchemy.run/domain/model#change-a-view-bump-its-version',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const definition = argumentAt(node, 1);

      if (
        domainBlock(node, getState()) === 'View' &&
        definition?.type === 'ObjectExpression' &&
        objectProperty(definition, 'version') === undefined
      ) {
        context.report({ node: node.callee, messageId: 'missing' });
      }
    },
  }),
);
