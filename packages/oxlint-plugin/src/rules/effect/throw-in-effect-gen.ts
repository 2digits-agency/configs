import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Match from 'effect/Match';
import * as Opt from 'effect/Option';

import { argumentAt, callbackCall, enclosingFunction, isSomeSame, type FunctionNode } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

const generatorMethods = ['fn', 'fnUntraced', 'gen'] as const satisfies ReadonlyArray<keyof typeof Effect>;

const curriedGeneratorMethods = ['fn', 'fnUntraced'] as const satisfies ReadonlyArray<keyof typeof Effect>;

const tryMethods = ['try', 'tryPromise'] as const satisfies ReadonlyArray<keyof typeof Effect>;

/**
 * Whether `Effect.try` or `Effect.tryPromise` captures throws from this function: it is their direct thunk or their
 * `try` option.
 *
 * @param node Function.
 * @param imports Import bindings of the file.
 */
function capturedByEffectTry(node: FunctionNode, imports: ImportBindings): boolean {
  return Match.value(node.parent).pipe(
    Match.when(
      { type: 'CallExpression' },
      (call) => isSomeSame<ESTree.Node>(argumentAt(call, 0), node) && imports.isApi(call.callee, 'Effect', tryMethods),
    ),
    Match.when(
      {
        type: 'Property',
        computed: false,
        key: { type: 'Identifier', name: 'try' },
        parent: { type: 'ObjectExpression', parent: { type: 'CallExpression' } },
      },
      (property) => imports.isApi(property.parent.parent.callee, 'Effect', tryMethods),
    ),
    Match.orElse(() => false),
  );
}

/**
 * Whether a function is the body of `Effect.gen(…)`, `Effect.fn(…)` or `Effect.fn('name')(…)`.
 *
 * @param node Function.
 * @param imports Import bindings of the file.
 */
function isGeneratorBody(node: FunctionNode, imports: ImportBindings): boolean {
  return Opt.exists(
    callbackCall(node),
    ({ callee }) =>
      imports.isApi(callee, 'Effect', generatorMethods) ||
      (callee.type === 'CallExpression' && imports.isApi(callee.callee, 'Effect', curriedGeneratorMethods)),
  );
}

export const throwInEffectGen: CreateRule = defineRule({
  name: 'throw-in-effect-gen',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow throw in Effect generator APIs because it creates an untyped defect.',
    messages: {
      throwInGen: 'Use yield* Effect.fail(...) instead of throw so the failure stays in the typed error channel.',
    },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('ThrowStatement', (node) =>
      Opt.exists(
        enclosingFunction(node),
        (callback) => !capturedByEffectTry(callback, imports) && isGeneratorBody(callback, imports),
      )
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'throwInGen' }))
        : Effect.void,
    );
  },
});
