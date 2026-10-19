import type { ESTree, Rule } from '@oxlint/plugins';

import {
  argumentAt,
  defineEffectRule,
  firstIdentifierParameter,
  functionUsesFirstParameter,
  isApi,
  ruleMeta,
  type FileState,
  type FunctionNode,
} from '../../utils';
import { promiseThunkArgument } from './utils';

function tryPromiseThunk(node: ESTree.CallExpression, state: FileState): FunctionNode | undefined {
  if (!isApi(node.callee, state, 'Effect', 'tryPromise')) {
    return undefined;
  }

  return promiseThunkArgument(argumentAt(node, 0));
}

export const requireTryPromiseAbortSignal: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Require Effect.tryPromise thunks to accept and use their AbortSignal for interruption.',
    {
      missingSignal:
        'Accept the AbortSignal parameter and pass it to the Promise API. Name it `_signal` only when cancellation is unsupported.',
      unusedSignal:
        'Pass this AbortSignal to the Promise API, or rename it to `_signal` to explicitly acknowledge that cancellation is unsupported.',
    },
    'https://www.effect.website/docs/v4/api/effect/Effect#tryPromise',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const thunk = tryPromiseThunk(node, getState());

      if (thunk === undefined) {
        return;
      }

      const signal = firstIdentifierParameter(thunk);

      if (signal === undefined) {
        context.report({ node: thunk, messageId: 'missingSignal' });
      } else if (!signal.name.startsWith('_') && !functionUsesFirstParameter(thunk)) {
        context.report({ node: signal, messageId: 'unusedSignal' });
      }
    },
  }),
);
