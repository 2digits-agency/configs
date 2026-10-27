import type { Rule } from '@oxlint/plugins';
import type * as Effect from 'effect/Effect';

import { defineEffectRule, isApi, ruleMeta } from '../../utils';

export const effectPromiseVsTryPromise: Rule = defineEffectRule(
  ruleMeta('problem', 'Require Effect.tryPromise so Promise rejections enter the typed error channel.', {
    tryPromise: 'Use Effect.tryPromise instead of Effect.promise so rejections are typed failures.',
  }),
  (context, getState) => ({
    CallExpression(node) {
      if (isApi(node.callee, getState(), 'Effect', 'promise' satisfies keyof typeof Effect)) {
        context.report({ node: node.callee, messageId: 'tryPromise' });
      }
    },
  }),
);
