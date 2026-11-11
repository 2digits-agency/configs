import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, isFunctionNode, objectProperty } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { functionResult, promiseInitializer } from './internal/callbacks';

export const noAsyncEffectTry = Rule.define({
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
        ? argumentAt(node, 0).pipe(
            Opt.flatMap((first) =>
              isFunctionNode(first)
                ? Opt.some(first)
                : first.type === 'ObjectExpression'
                  ? objectProperty(first, 'try').pipe(
                      Opt.map(({ value }) => value),
                      Opt.filter(isFunctionNode),
                    )
                  : Opt.none(),
            ),
            Opt.filter((thunk) => thunk.async || Opt.exists(functionResult(thunk), promiseInitializer)),
            Opt.match({
              onNone: () => Effect.void,
              onSome: (thunk) => ctx.report(Diagnostic.fromId({ node: thunk, messageId: 'asyncTry' })),
            }),
          )
        : Effect.void,
    );
  },
});
