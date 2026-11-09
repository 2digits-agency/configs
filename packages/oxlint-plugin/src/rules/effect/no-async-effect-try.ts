import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, isFunctionNode, objectProperty, type FunctionNode } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { functionResult, promiseInitializer } from './internal/callbacks';

/**
 * The thunk of an `Effect.try` call, passed directly or as the `try` option.
 *
 * @param node `Effect.try` call.
 */
function tryThunk(node: ESTree.CallExpression): Opt.Option<FunctionNode> {
  return Opt.flatMap(argumentAt(node, 0), (first) =>
    isFunctionNode(first)
      ? Opt.some(first)
      : first.type === 'ObjectExpression'
        ? Opt.filter(
            Opt.map(objectProperty(first, 'try'), ({ value }) => value),
            isFunctionNode,
          )
        : Opt.none(),
  );
}

export const noAsyncEffectTry: CreateRule = Rule.define({
  name: 'no-async-effect-try',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow async thunks in Effect.try because rejected Promises bypass its catch mapper.',
    messages: {
      asyncTry:
        'Effect.try does not await Promises. Use Effect.tryPromise so rejection enters the typed error channel.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/657',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Effect', 'try' satisfies keyof typeof Effect)
        ? Opt.match(
            Opt.filter(tryThunk(node), (thunk) => thunk.async || Opt.exists(functionResult(thunk), promiseInitializer)),
            {
              onNone: () => Effect.void,
              onSome: (thunk) => ctx.report(Diagnostic.fromId({ node: thunk, messageId: 'asyncTry' })),
            },
          )
        : Effect.void,
    );
  },
});
