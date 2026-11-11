import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { enclosingFunction } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { callbackApi, functionProperty } from './internal/callbacks';

const PureCallbackMethod = Schema.Literals([
  ...(['andThen', 'map', 'mapError', 'tap', 'tapError'] satisfies ReadonlyArray<keyof typeof Effect>),
  // Effect v3 name, which the current Effect types no longer export.
  'tapErrorCause',
]);

const isPureCallbackMethod = Schema.is(PureCallbackMethod);

export const noThrowInEffectCallback = Rule.define({
  name: 'no-throw-in-effect-callback',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow throw in Effect callbacks that cannot add the thrown value to the typed error channel.',
    messages: {
      callbackThrow:
        'Throwing in this Effect callback creates an untyped defect. Return Effect.fail(...) or return the mapped error value instead.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/406',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('ThrowStatement', (node: ESTree.ThrowStatement) =>
      Opt.exists(
        enclosingFunction(node),
        (callback) =>
          Opt.exists(
            callbackApi(callback, imports),
            ([namespace, member]) => namespace === 'Effect' && isPureCallbackMethod(member),
          ) ||
          Opt.exists(functionProperty(callback, 'catch'), (call) =>
            imports.isApi(call.callee, 'Effect', ['try', 'tryPromise'] satisfies ReadonlyArray<keyof typeof Effect>),
          ),
      )
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'callbackThrow' }))
        : Effect.void,
    );
  },
});
