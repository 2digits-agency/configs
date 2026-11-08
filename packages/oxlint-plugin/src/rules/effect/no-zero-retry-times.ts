import type { Rule } from '@oxlint/plugins';
import type * as Effect from 'effect/Effect';
import * as P from 'effect/Predicate';

import { defineEffectRule, isAnyApi, isLiteral, objectProperty, ruleMeta } from '../../utils';
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

      if (!isAnyApi(node.callee, state, 'Effect', ['retry', 'repeat'] satisfies ReadonlyArray<keyof typeof Effect>)) {
        return;
      }

      const options = objectArgument(node);

      if (P.isUndefined(options)) {
        return;
      }

      const times = objectProperty(options, 'times');

      if (P.isNotUndefined(times) && isLiteral(times.value, 0)) {
        context.report({ node: times, messageId: 'zeroTimes' });
      }
    },
  }),
);
