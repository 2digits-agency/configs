import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { enclosingFunction, type FunctionNode } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { callbackApi, functionProperty } from './internal/callbacks';

const PureCallbackMethod = Schema.Literals([
  ...(['andThen', 'map', 'mapError', 'tap', 'tapError'] satisfies ReadonlyArray<keyof typeof Effect>),
  // Effect v3 name, which the current Effect types no longer export.
  'tapErrorCause',
]);

const isPureCallbackMethod = Schema.is(PureCallbackMethod);

function isTypedErrorCallback(callback: FunctionNode, imports: ImportBindings): boolean {
  return (
    Opt.exists(
      callbackApi(callback, imports),
      ([namespace, member]) => namespace === 'Effect' && isPureCallbackMethod(member),
    ) ||
    Opt.exists(functionProperty(callback, 'catch'), (call) =>
      imports.isApi(call.callee, 'Effect', ['try', 'tryPromise'] satisfies ReadonlyArray<keyof typeof Effect>),
    )
  );
}

export const noThrowInEffectCallback: CreateRule = Rule.define({
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
      Opt.exists(enclosingFunction(node), (callback) => isTypedErrorCallback(callback, imports))
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'callbackThrow' }))
        : Effect.void,
    );
  },
});
