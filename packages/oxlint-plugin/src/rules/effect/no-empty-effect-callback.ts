import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, isFunctionNode, type FunctionNode } from '../../internal/ast';
import { namespaceImport, withOptionalFix } from '../../internal/fixes';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isImportedApi } from '../../internal/scope';

function emptyRegister(node: ESTree.CallExpression): Opt.Option<FunctionNode> {
  return Opt.filter(
    argumentAt(node, 0),
    (register): register is FunctionNode =>
      isFunctionNode(register) &&
      register.body?.type === 'BlockStatement' &&
      Arr.isReadonlyArrayEmpty(register.body.body),
  );
}

export const noEmptyEffectCallback: CreateRule = Rule.define({
  name: 'no-empty-effect-callback',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect.never to an empty Effect.callback registration.',
    messages: { emptyCallback: 'An empty Effect.callback registration is Effect.never. Use the explicit primitive.' },
    url: 'https://github.com/Effect-TS/tsgo/issues/636',
    fixable: 'code',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    /**
     * Rewrite to `Effect.never` only when the call is exactly `Effect.callback(() => {})` without comments.
     *
     * @param node `Effect.callback` call.
     * @param register Empty registration.
     */
    const neverFix = Effect.fnUntraced(function* (node: ESTree.CallExpression, register: FunctionNode) {
      if (
        node.arguments.length !== 1 ||
        register.async ||
        register.generator ||
        Arr.some(register.params, (parameter) => parameter.type !== 'Identifier') ||
        Arr.isReadonlyArrayNonEmpty(ctx.sourceCode.getCommentsInside(node)) ||
        !(yield* isImportedApi(node.callee))
      ) {
        return Opt.none();
      }

      const imported = yield* namespaceImport(node, 'effect/Effect', 'Effect');

      return Opt.some(
        Diagnostic.composeFixes(
          ...Opt.toArray(imported.fix),
          Diagnostic.replaceText(node, `${imported.name}.${'never' satisfies keyof typeof Effect}`),
        ),
      );
    });

    function isCallbackApi(callee: ESTree.Node) {
      return (
        imports.isApi(callee, 'Effect', 'callback' satisfies keyof typeof Effect) ||
        // Effect v3 name, which the current Effect types no longer export.
        imports.isApi(callee, 'Effect', 'async')
      );
    }

    return Visitor.on('CallExpression', (node) =>
      isCallbackApi(node.callee)
        ? Opt.match(emptyRegister(node), {
            onNone: () => Effect.void,
            onSome: (register) =>
              Effect.flatMap(neverFix(node, register), (fix) =>
                ctx.report(withOptionalFix(Diagnostic.fromId({ node, messageId: 'emptyCallback' }), fix)),
              ),
          })
        : Effect.void,
    );
  },
});
