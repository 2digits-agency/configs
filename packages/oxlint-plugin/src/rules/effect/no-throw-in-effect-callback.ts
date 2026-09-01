import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, enclosingFunction, isApi, ruleMeta } from '../../utils';
import { callbackApi, functionProperty } from './utils';

const pureCallbackMethods = new Set(['andThen', 'map', 'mapError', 'tap', 'tapError', 'tapErrorCause']);

export const noThrowInEffectCallback: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow throw in Effect callbacks that cannot add the thrown value to the typed error channel.',
    {
      callbackThrow:
        'Throwing in this Effect callback creates an untyped defect. Return Effect.fail(...) or return the mapped error value instead.',
    },
    'https://github.com/Effect-TS/tsgo/issues/406',
  ),
  (context, getState) => ({
    ThrowStatement(node) {
      const callback = enclosingFunction(node);

      if (callback === undefined) {
        return;
      }

      const state = getState();
      const path = callbackApi(callback, state);
      const optionsCall = functionProperty(callback, 'catch');

      if (
        (path?.[0] === 'Effect' && path[1] !== undefined && pureCallbackMethods.has(path[1])) ||
        (optionsCall !== undefined &&
          (isApi(optionsCall.callee, state, 'Effect', 'try') ||
            isApi(optionsCall.callee, state, 'Effect', 'tryPromise')))
      ) {
        context.report({ node, messageId: 'callbackThrow' });
      }
    },
  }),
);
