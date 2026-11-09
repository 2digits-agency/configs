import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';

import { argumentAt, staticPath, unwrapExpression } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const getOrThrowMethods = ['getOrThrow', 'getOrThrowWith'] as const satisfies ReadonlyArray<keyof typeof Opt>;

function isServiceOptionCall(node: ESTree.Node, imports: ImportBindings): boolean {
  return (
    node.type === 'CallExpression' &&
    imports.isApi(node.callee, 'Effect', 'serviceOption' satisfies keyof typeof Effect)
  );
}

/**
 * `Option.getOrThrow(yield* Effect.serviceOption(Tag))` or
 * `Effect.serviceOption(Tag).pipe(Effect.map(Option.getOrThrow))`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function throwsMissingService(node: ESTree.CallExpression, imports: ImportBindings): boolean {
  if (imports.isApi(node.callee, 'Option', getOrThrowMethods)) {
    return Opt.exists(argumentAt(node, 0), (option) =>
      option.type === 'YieldExpression'
        ? P.isNotNullish(option.argument) && isServiceOptionCall(option.argument, imports)
        : isServiceOptionCall(option, imports),
    );
  }

  return (
    node.callee.type === 'MemberExpression' &&
    Opt.exists(staticPath(node.callee), (path) => Arr.lastNonEmpty(path) === 'pipe') &&
    isServiceOptionCall(unwrapExpression(node.callee.object), imports) &&
    Opt.exists(
      argumentAt(node, 0),
      (map) =>
        map.type === 'CallExpression' &&
        imports.isApi(map.callee, 'Effect', 'map' satisfies keyof typeof Effect) &&
        Opt.exists(argumentAt(map, 0), (mapper) => imports.isApi(mapper, 'Option', getOrThrowMethods)),
    )
  );
}

export const noServiceOptionGetOrThrow: CreateRule = Rule.define({
  name: 'no-service-option-get-or-throw',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow turning missing Effect services into untyped Option defects.',
    messages: {
      getOrThrow:
        'Option.getOrThrow after Effect.serviceOption hides a mandatory service until runtime. Use Effect.service so it remains a typed requirement.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/650',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      throwsMissingService(node, imports)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'getOrThrow' }))
        : Effect.void,
    );
  },
});
