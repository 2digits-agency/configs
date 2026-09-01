import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, isApi, isDiscarded, ruleMeta } from '../../utils';

export const noDiscardedRunPromise: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow discarded Effect.runPromise results that can become unhandled rejections.',
    {
      discarded:
        'The Promise returned by Effect.runPromise is discarded. Await/return/handle it, or use Effect.runFork for fire-and-forget work.',
    },
    'https://github.com/Effect-TS/tsgo/issues/643',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();
      const direct = isApi(node.callee, state, 'Effect', 'runPromise');
      const withRuntime =
        node.callee.type === 'CallExpression' && isApi(node.callee.callee, state, 'Effect', 'runPromiseWith');

      if ((direct || withRuntime) && isDiscarded(node)) {
        context.report({ node, messageId: 'discarded' });
      }
    },
  }),
);
