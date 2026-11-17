import { Diagnostic, Rule, RuleContext, Visitor, type ESTree, type OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Str from 'effect/String';

import { isFunctionNode, type FunctionNode } from '../../internal/ast';
import { argumentText } from '../../internal/fixes';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { lookupVariable } from '../../internal/scope';
import {
  forwardedCall,
  isAnnotated,
  isDetachableCallee,
  isEffectGuard,
  isSettledCallee,
  isTypeGuard,
  unaryEffectCallback,
} from './internal/forwarding';

/**
 * Whether a callee is a function of this file with exactly one signature: a function declaration without overloads, or
 * an unannotated `const` holding a function expression. TypeScript infers a callback type from the last overload, so an
 * overloaded callee, such as an Effect dual API, can stop type-checking once passed directly.
 *
 * @param sourceCode Source of the file.
 * @param callee Forwarded callee.
 */
function isLocalSingleSignature(sourceCode: OxlintSourceCode, callee: ESTree.Expression | ESTree.Super): boolean {
  if (callee.type !== 'Identifier') {
    return false;
  }

  return Opt.exists(lookupVariable(sourceCode, callee, callee.name), ({ defs }) => {
    const [definition] = defs;

    if (!definition || defs.length !== 1) {
      return false;
    }

    if (definition.type === 'FunctionName') {
      return definition.node.type === 'FunctionDeclaration';
    }

    const declarator = definition.node;

    return (
      definition.type === 'Variable' &&
      declarator.type === 'VariableDeclarator' &&
      declarator.id.type === 'Identifier' &&
      !declarator.id.typeAnnotation &&
      P.isNotNull(declarator.init) &&
      isFunctionNode(declarator.init)
    );
  });
}

/**
 * Report callbacks of Effect APIs that only pass their parameters on, such as `Effect.map((value) => f(value))`.
 */
export const noForwardingLambda = Rule.define({
  name: 'no-forwarding-lambda',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow Effect callbacks that only forward their parameters to another function.',
    messages: {
      forwardingLambda: 'This callback only passes its parameters to {{callee}}. Pass {{callee}} directly.',
      passCallee: 'Pass {{callee}} directly.',
    },
    fixable: 'code',
    hasSuggestions: true,
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    const { sourceCode } = ctx;

    const report = Effect.fnUntraced(function* (node: FunctionNode, call: ESTree.CallExpression) {
      const text = sourceCode.getText(call.callee);

      const callee = Str.includes('\n')(text) ? 'the callee' : `\`${text}\``;

      const diagnostic = Diagnostic.fromId({ node, messageId: 'forwardingLambda', data: { callee } });

      if (
        Arr.isReadonlyArrayNonEmpty(sourceCode.getCommentsInside(node)) ||
        !isSettledCallee(sourceCode, call.callee, node)
      ) {
        return yield* ctx.report(diagnostic);
      }

      const fix = Diagnostic.replaceText(node, argumentText(sourceCode, call.callee));

      return yield* ctx.report(
        isLocalSingleSignature(sourceCode, call.callee) && !isAnnotated(node)
          ? Diagnostic.withFix(diagnostic, fix)
          : Diagnostic.withSuggestions(diagnostic, [{ messageId: 'passCallee', data: { callee }, fix }]),
      );
    });

    // Report when the Effect API that receives the callback passes it one argument and the callee can replace it as is.
    function check(node: FunctionNode) {
      return unaryEffectCallback(node, imports).pipe(
        Opt.flatMap(() => forwardedCall(node)),
        Opt.filter(
          ({ exact, call }) =>
            exact &&
            isDetachableCallee(call.callee, imports) &&
            // A type predicate, as `Schema.declare` needs, is lost when passing a callee that only returns `boolean`.
            (!isTypeGuard(node) || isEffectGuard(call.callee, imports)),
        ),
        Opt.match({ onNone: () => Effect.void, onSome: ({ call }) => report(node, call) }),
      );
    }

    return Visitor.merge(Visitor.on('ArrowFunctionExpression', check), Visitor.on('FunctionExpression', check));
  },
});
