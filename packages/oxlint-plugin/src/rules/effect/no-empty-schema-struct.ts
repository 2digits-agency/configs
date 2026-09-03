import type { Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, isApi, ruleMeta } from '../../utils';

export const noEmptySchemaStruct: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow Schema.Struct({}), which accepts every non-null object-like value.',
    {
      emptyStruct: 'Schema.Struct({}) does not validate an exact empty object. Define the intended fields explicitly.',
    },
    'https://github.com/Effect-TS/tsgo/issues/403',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const fields = argumentAt(node, 0);

      if (
        isApi(node.callee, getState(), 'Schema', 'Struct') &&
        fields?.type === 'ObjectExpression' &&
        fields.properties.length === 0
      ) {
        context.report({ node, messageId: 'emptyStruct' });
      }
    },
  }),
);
