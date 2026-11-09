import { Diagnostic, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import {
  containsIdentifier,
  firstIdentifierParameter,
  isErrorConstructor,
  walkNodes,
  type FunctionNode,
} from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { callbackApi, functionProperty } from './internal/callbacks';

const ErrorHandlerMethod = Schema.Literals([
  ...(['catch', 'mapError'] satisfies ReadonlyArray<keyof typeof Effect>),
  // Effect v3 name, which the current Effect types no longer export.
  'catchAll',
]);

const isErrorHandlerMethod = Schema.is(ErrorHandlerMethod);

function isErrorHandler(node: FunctionNode, imports: ImportBindings): boolean {
  return (
    Opt.exists(
      callbackApi(node, imports),
      ([namespace, member]) => namespace === 'Effect' && isErrorHandlerMethod(member),
    ) ||
    Opt.exists(functionProperty(node, 'catch'), (call) =>
      imports.isApi(call.callee, 'Effect', ['try', 'tryPromise'] satisfies ReadonlyArray<keyof typeof Effect>),
    )
  );
}

/**
 * Whether an Effect error handler constructs a new error without passing it the caught failure.
 *
 * @param node Handler.
 * @param imports Import bindings of the file.
 */
function wrapperDropsCause(node: FunctionNode, imports: ImportBindings): boolean {
  const parameter = firstIdentifierParameter(node);

  return (
    P.isNotNullish(node.body) &&
    isErrorHandler(node, imports) &&
    walkNodes(
      node.body,
      (child) =>
        child.type === 'NewExpression' &&
        isErrorConstructor(child) &&
        !Opt.exists(parameter, ({ name }) => containsIdentifier(child, name)),
    )
  );
}

export const preserveCaughtError: CreateRule = defineRule({
  name: 'preserve-caught-error',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Preserve the underlying cause when wrapping an Effect failure.',
    messages: {
      droppedCause:
        'This handler constructs a new error but drops the caught failure. Accept it as a parameter and attach it as cause.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/490',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    function check(node: FunctionNode) {
      return wrapperDropsCause(node, imports)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'droppedCause' }))
        : Effect.void;
    }

    return Visitor.merge(Visitor.on('ArrowFunctionExpression', check), Visitor.on('FunctionExpression', check));
  },
});
