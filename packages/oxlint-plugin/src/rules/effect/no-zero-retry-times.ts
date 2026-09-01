import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, isApi, isLiteral, objectProperty, ruleMeta } from '../../utils';
import { objectArgument } from './utils';

export const noZeroRetryTimes: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow no-op retry and repeat wrappers with times: 0.',
    {
      zeroTimes: 'times: 0 performs no retries or repeats. Remove the wrapper or use a positive count.',
    },
    'https://github.com/Effect-TS/tsgo/issues/412',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (!isApi(node.callee, state, 'Effect', 'retry') && !isApi(node.callee, state, 'Effect', 'repeat')) {
        return;
      }

      const options = objectArgument(node);

      if (options === undefined) {
        return;
      }

      const times = objectProperty(options, 'times');

      if (times !== undefined && isLiteral(times.value, 0)) {
        context.report({ node: times, messageId: 'zeroTimes' });
      }
    },
  }),
);
