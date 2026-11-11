import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Str from 'effect/String';

import { argumentAt, firstIdentifierParameter, functionUsesFirstParameter } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { promiseThunkArgument } from './internal/callbacks';

export const requireTryPromiseAbortSignal = Rule.define({
  name: 'require-try-promise-abort-signal',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Require Effect.tryPromise thunks to accept and use their AbortSignal for interruption.',
    messages: {
      missingSignal:
        'Accept the AbortSignal parameter and pass it to the Promise API. Name it `_signal` only when cancellation is unsupported.',
      unusedSignal:
        'Pass this AbortSignal to the Promise API, or rename it to `_signal` to explicitly acknowledge that cancellation is unsupported.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Effect#tryPromise',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Effect', 'tryPromise' satisfies keyof typeof Effect)
        ? Opt.match(promiseThunkArgument(argumentAt(node, 0)), {
            onNone: () => Effect.void,
            onSome: (thunk) =>
              Opt.match(firstIdentifierParameter(thunk), {
                onNone: () => ctx.report(Diagnostic.fromId({ node: thunk, messageId: 'missingSignal' })),
                onSome: (signal) =>
                  Str.startsWith('_')(signal.name) || functionUsesFirstParameter(thunk)
                    ? Effect.void
                    : ctx.report(Diagnostic.fromId({ node: signal, messageId: 'unusedSignal' })),
              }),
          })
        : Effect.void,
    );
  },
});
