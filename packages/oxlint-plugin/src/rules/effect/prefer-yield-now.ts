import type { ESTree, Rule } from '@oxlint/plugins';

import {
  argumentAt,
  canonicalPath,
  defineEffectRule,
  isApi,
  isLiteral,
  ruleMeta,
  unwrapExpression,
  type FileState,
} from '../../utils';

function zeroDuration(node: ESTree.Expression, state: FileState): boolean {
  const expression = unwrapExpression(node);

  if (isLiteral(expression, 0)) {
    return true;
  }

  if (expression.type === 'Literal' && typeof expression.value === 'string') {
    return /^0\s*(?:nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/i.test(expression.value);
  }

  if (isApi(expression, state, 'Duration', 'zero')) {
    return true;
  }

  if (expression.type === 'CallExpression') {
    const path = canonicalPath(expression.callee, state);
    const amount = argumentAt(expression, 0);

    return amount !== undefined && path?.[0] === 'Duration' && isLiteral(amount, 0);
  }

  return false;
}

export const preferYieldNow: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer scheduler yielding to a zero-duration Clock sleep.',
    {
      zeroSleep:
        'Effect.sleep(0) uses Clock and interacts with TestClock. Use Effect.yieldNow for a cooperative scheduler yield.',
    },
    'https://github.com/Effect-TS/tsgo/issues/661',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();
      const duration = argumentAt(node, 0);

      if (duration !== undefined && isApi(node.callee, state, 'Effect', 'sleep') && zeroDuration(duration, state)) {
        context.report({ node, messageId: 'zeroSleep' });
      }
    },
  }),
);
