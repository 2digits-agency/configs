import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, isApi, ruleMeta } from '../../utils';

export const requireSchemaClassBrand: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Require Schema.Class declarations to carry a nominal brand.',
    {
      missingBrand:
        'Schema.Class without a second type parameter is structural. Add a unique brand so plain objects cannot masquerade as instances.',
    },
    'https://github.com/Effect-TS/tsgo/issues/468',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (isApi(node.callee, getState(), 'Schema', 'Class') && (node.typeArguments?.params.length ?? 0) < 2) {
        context.report({ node, messageId: 'missingBrand' });
      }
    },
  }),
);
