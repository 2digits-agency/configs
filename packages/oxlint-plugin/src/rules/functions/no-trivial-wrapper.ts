import { Diagnostic, Rule, RuleContext, Visitor, type ESTree, type OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';

import { isFunctionNode, type FunctionNode } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { forwardedCall, isDetachableCallee, isEffectGuard, isTypeGuard } from './internal/forwarding';

const maxCalleeLength = 60;

function calleeText(call: ESTree.CallExpression, sourceCode: OxlintSourceCode): string {
  const text = Str.replaceAll(/\s+/gu, ' ')(sourceCode.getText(call.callee));

  return text.length > maxCalleeLength ? `${Str.slice(0, maxCalleeLength - 1)(text)}…` : text;
}

/**
 * Whether a type predicate narrows where the callee can't: it wraps a plain boolean check, such as `Set.has`, or
 * refines a typed parameter, such as `Arr.isArray` on a union, which only narrows to `Array<unknown>`.
 *
 * @param node Wrapper.
 * @param callee Forwarded callee.
 * @param imports Import bindings of the file.
 */
function narrowsBeyondCallee(
  node: FunctionNode,
  callee: ESTree.Expression | ESTree.Super,
  imports: ImportBindings,
): boolean {
  return (
    isTypeGuard(node) &&
    (!isEffectGuard(callee, imports) ||
      Arr.some(
        node.params,
        (parameter) =>
          parameter.type === 'Identifier' &&
          P.isNotNullish(parameter.typeAnnotation) &&
          parameter.typeAnnotation.typeAnnotation.type !== 'TSUnknownKeyword',
      ))
  );
}

/**
 * Report named functions that only pass their parameters on to another call, such as `isUser(input)` around
 * `Schema.is(User)(input)` or `logStep(message)` around `Effect.logDebug(message)`.
 */
export const noTrivialWrapper = Rule.define({
  name: 'no-trivial-wrapper',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow named functions that only forward their parameters to another call.',
    messages: {
      forwardsParameters:
        '`{{name}}` only passes its parameters to `{{callee}}`. Call `{{callee}}` directly, or assign it to a constant instead of wrapping it.',
      forwardsWithArguments:
        '`{{name}}` only passes its parameters to `{{callee}}` with fixed arguments. Call it inline, or hoist a constant built from those arguments, such as `Match.typeTags` or `Schema.is(Schema)`.',
    },
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    function check(node: FunctionNode, name: ESTree.BindingIdentifier) {
      return forwardedCall(node).pipe(
        /*
         * Fixed arguments only leave a constant to hoist for `Match.valueTags(x, cases)`, as `Match.typeTags`, and a
         * one-step `pipe(x, step)`, as `step`. Others, such as `Cron.parseUnsafe(x, zone)`, are a named partial
         * application. `set.has` loses its `this` when passed as a value, so the wrapper is how a module exposes it.
         */
        Opt.filter(
          ({ call, exact }) =>
            !narrowsBeyondCallee(node, call.callee, imports) &&
            isDetachableCallee(call.callee, imports) &&
            (exact ||
              imports.isApi(call.callee, 'Match', 'valueTags') ||
              (imports.isApi(call.callee, 'Function', 'pipe') && call.arguments.length === 2)),
        ),
        Opt.match({
          onNone: () => Effect.void,
          onSome: ({ call, exact }) =>
            ctx.report(
              Diagnostic.fromId({
                node: name,
                messageId: exact ? 'forwardsParameters' : 'forwardsWithArguments',
                data: { name: name.name, callee: calleeText(call, ctx.sourceCode) },
              }),
            ),
        }),
      );
    }

    return Visitor.merge(
      Visitor.on('FunctionDeclaration', (node) => (node.id && node.body ? check(node, node.id) : Effect.void)),
      Visitor.on('VariableDeclarator', (node) =>
        node.id.type === 'Identifier' && node.init && isFunctionNode(node.init)
          ? check(node.init, node.id)
          : Effect.void,
      ),
    );
  },
});
