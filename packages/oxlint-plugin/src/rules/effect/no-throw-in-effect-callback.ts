import type { Rule } from '@oxlint/plugins';
import type * as Effect from 'effect/Effect';
import * as P from 'effect/Predicate';

import { defineEffectRule, enclosingFunction, isAnyApi, ruleMeta } from '../../utils';
import { callbackApi, functionProperty } from './utils';

const pureCallbackMethods: ReadonlySet<string> = new Set([
  ...(['andThen', 'map', 'mapError', 'tap', 'tapError'] satisfies ReadonlyArray<keyof typeof Effect>),
  // Effect v3 name, which the current Effect types no longer export.
  'tapErrorCause',
]);

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

      if (P.isUndefined(callback)) {
        return;
      }

      const state = getState();

      const path = callbackApi(callback, state);

      const optionsCall = functionProperty(callback, 'catch');

      if (
        (path?.[0] === 'Effect' && P.isNotUndefined(path[1]) && pureCallbackMethods.has(path[1])) ||
        (P.isNotUndefined(optionsCall) &&
          isAnyApi(optionsCall.callee, state, 'Effect', ['try', 'tryPromise'] satisfies ReadonlyArray<
            keyof typeof Effect
          >))
      ) {
        context.report({ node, messageId: 'callbackThrow' });
      }
    },
  }),
);
