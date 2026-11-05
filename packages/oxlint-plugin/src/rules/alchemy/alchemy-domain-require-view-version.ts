import type { Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';

import { argumentAt, defineEffectRule, objectProperty, ruleMeta, unwrapExpression } from '../../utils';
import { domainBlock } from './domain';

export const alchemyDomainRequireViewVersion: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Require Alchemy Domain views to declare their version.',
    {
      missing:
        'Declare `version` on this view (`version: 0` keeps the current default). Bump it whenever `evolve`, `emit`, `keyOf`, `state` or `from` changes, so the deploy rebuilds the view from its events.',
      overridden: 'Move `version` after the spread, so the spread cannot override the version this view declares.',
    },
    'https://alchemy.run/domain/model#change-a-view-bump-its-version',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const argument = argumentAt(node, 1);

      const definition = argument === undefined ? undefined : unwrapExpression(argument);

      if (domainBlock(node, getState(), context) !== 'View' || definition?.type !== 'ObjectExpression') {
        return;
      }

      const version = objectProperty(definition, 'version');

      if (version === undefined) {
        context.report({ node: node.callee, messageId: 'missing' });
      } else if (
        Arr.some(
          definition.properties.slice(definition.properties.indexOf(version) + 1),
          (property) => property.type === 'SpreadElement',
        )
      ) {
        context.report({ node: version, messageId: 'overridden' });
      }
    },
  }),
);
