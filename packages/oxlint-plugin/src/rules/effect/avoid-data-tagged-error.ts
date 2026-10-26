import type { Rule } from '@oxlint/plugins';
import type * as Data from 'effect/Data';

import { defineEffectRule, isApi, ruleMeta } from '../../utils';

export const avoidDataTaggedError: Rule = defineEffectRule(
  ruleMeta('suggestion', 'Prefer schema-based tagged errors so errors have a serializable contract.', {
    taggedError: 'Prefer Schema.TaggedError over Data.TaggedError.',
  }),
  (context, getState) => ({
    CallExpression(node) {
      if (isApi(node.callee, getState(), 'Data', 'TaggedError' satisfies keyof typeof Data)) {
        context.report({ node: node.callee, messageId: 'taggedError' });
      }
    },
  }),
);
