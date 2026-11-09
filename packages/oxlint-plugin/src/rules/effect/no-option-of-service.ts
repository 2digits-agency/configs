import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, staticPath, unwrapExpression } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

// `either` is the Effect v3 name, which the current Effect types no longer export.
const wrapperMethods = ['option' satisfies keyof typeof Effect, 'either'];

function isServiceCall(node: ESTree.Node, imports: ImportBindings): boolean {
  return (
    node.type === 'CallExpression' && imports.isApi(node.callee, 'Effect', 'service' satisfies keyof typeof Effect)
  );
}

/**
 * `Effect.option(Effect.service(Tag))` or `Effect.service(Tag).pipe(Effect.option)`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function wrapsService(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  const operand = argumentAt(node, 0);

  if (imports.isApi(node.callee, 'Effect', wrapperMethods)) {
    return Opt.exists(operand, (wrapped) => isServiceCall(wrapped, imports));
  }

  return (
    node.callee.type === 'MemberExpression' &&
    Opt.exists(staticPath(node.callee), (path) => Arr.lastNonEmpty(path) === 'pipe') &&
    isServiceCall(unwrapExpression(node.callee.object), imports) &&
    Opt.exists(operand, (operator) => imports.isApi(operator, 'Effect', wrapperMethods))
  );
}

export const noOptionOfService: CreateRule = Rule.define({
  name: 'no-option-of-service',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow wrapping infallible Effect.service access in Option or Either.',
    messages: {
      mandatory:
        'Effect.service never fails, so this wrapper is always present and keeps the service requirement. Use Effect.serviceOption.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/648',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      wrapsService(node, imports) ? ctx.report(Diagnostic.fromId({ node, messageId: 'mandatory' })) : Effect.void,
    );
  },
});
