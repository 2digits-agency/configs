import type { Context, ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';

import { defineEffectRule, isAnyApi, isFunctionNode, ruleMeta, type FileState, type FunctionNode } from '../../utils';
import { forwardedCall, isDetachableCallee, isEffectGuard, isTypeGuard } from './forwarding';

const maxCalleeLength = 60;

function calleeText(call: ESTree.CallExpression, context: Context): string {
  const text = Str.replaceAll(/\s+/gu, ' ')(context.sourceCode.getText(call.callee));

  return text.length > maxCalleeLength ? `${Str.slice(0, maxCalleeLength - 1)(text)}…` : text;
}

function report(context: Context, state: FileState, node: FunctionNode, name: ESTree.BindingIdentifier): void {
  const forwarding = forwardedCall(node);

  const callee = forwarding?.call.callee;

  if (
    P.isUndefined(forwarding) ||
    P.isUndefined(callee) ||
    /*
     * A type predicate narrows where the callee can't when it wraps a plain boolean check, such as `Set.has`, or
     * refines a typed parameter, such as `Arr.isArray` on a union, which only narrows to `Array<unknown>`.
     */
    (isTypeGuard(node) &&
      (!isEffectGuard(callee, state) ||
        Arr.some(
          node.params,
          (parameter) =>
            parameter.type === 'Identifier' &&
            P.isNotNullish(parameter.typeAnnotation) &&
            parameter.typeAnnotation.typeAnnotation.type !== 'TSUnknownKeyword',
        ))) ||
    // `set.has` loses its `this` when passed as a value, so the wrapper is how a module exposes it.
    !isDetachableCallee(callee, state) ||
    /*
     * Fixed arguments only leave a constant to hoist for `Match.valueTags(x, cases)`, as `Match.typeTags`, and a
     * one-step `pipe(x, step)`, as `step`. Others, such as `Cron.parseUnsafe(x, zone)`, are a named partial application.
     */
    (!forwarding.exact &&
      !isAnyApi(callee, state, 'Match', ['valueTags']) &&
      (!isAnyApi(callee, state, 'Function', ['pipe']) || forwarding.call.arguments.length !== 2))
  ) {
    return;
  }

  context.report({
    node: name,
    messageId: forwarding.exact ? 'forwardsParameters' : 'forwardsWithArguments',
    data: { name: name.name, callee: calleeText(forwarding.call, context) },
  });
}

/**
 * Report named functions that only pass their parameters on to another call, such as `isUser(input)` around
 * `Schema.is(User)(input)` or `logStep(message)` around `Effect.logDebug(message)`.
 */
export const noTrivialWrapper: Rule = defineEffectRule(
  ruleMeta('suggestion', 'Disallow named functions that only forward their parameters to another call.', {
    forwardsParameters:
      '`{{name}}` only passes its parameters to `{{callee}}`. Call `{{callee}}` directly, or assign it to a constant instead of wrapping it.',
    forwardsWithArguments:
      '`{{name}}` only passes its parameters to `{{callee}}` with fixed arguments. Call it inline, or hoist a constant built from those arguments, such as `Match.typeTags` or `Schema.is(Schema)`.',
  }),
  (context, getState) => ({
    FunctionDeclaration(node) {
      if (node.id && node.body) {
        report(context, getState(), node, node.id);
      }
    },
    VariableDeclarator(node) {
      if (node.id.type === 'Identifier' && node.init && isFunctionNode(node.init)) {
        report(context, getState(), node.init, node.id);
      }
    },
  }),
);
