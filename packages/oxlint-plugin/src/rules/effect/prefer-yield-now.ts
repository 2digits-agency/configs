import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Duration from 'effect/Duration';
import type * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';

import {
  argumentAt,
  canonicalPath,
  defineEffectRule,
  isApi,
  isLiteral,
  isStringLiteral,
  ruleMeta,
  unwrapExpression,
  type FileState,
} from '../../utils';

function zeroDuration(node: ESTree.Expression, state: FileState): boolean {
  const expression = unwrapExpression(node);

  if (isLiteral(expression, 0)) {
    return true;
  }

  if (isStringLiteral(expression)) {
    return /^0\s*(?:nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/i.test(expression.value);
  }

  if (isApi(expression, state, 'Duration', 'zero' satisfies keyof typeof Duration)) {
    return true;
  }

  if (expression.type === 'CallExpression') {
    const path = canonicalPath(expression.callee, state);

    const amount = argumentAt(expression, 0);

    return P.isNotUndefined(amount) && Opt.contains(Arr.head(path ?? []), 'Duration') && isLiteral(amount, 0);
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

      if (
        P.isNotUndefined(duration) &&
        isApi(node.callee, state, 'Effect', 'sleep' satisfies keyof typeof Effect) &&
        zeroDuration(duration, state)
      ) {
        context.report({ node, messageId: 'zeroSleep' });
      }
    },
  }),
);
