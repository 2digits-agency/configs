import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { isLiteral, objectArgument, objectProperty, staticPropertyName, unwrapExpression } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const SchemaMapMethod = Schema.Literals(['mapElements', 'mapFields', 'mapMembers'] satisfies ReadonlyArray<
  | keyof Schema.Struct<Schema.Struct.Fields>
  | keyof Schema.Tuple<Schema.Tuple.Elements>
  | keyof Schema.Union<ReadonlyArray<Schema.Constraint>>
>);

const isSchemaMapMethod = Schema.is(SchemaMapMethod);

function isMethodCall(node: ESTree.Expression, method: string): boolean {
  const expression = unwrapExpression(node);

  return (
    expression.type === 'CallExpression' &&
    expression.callee.type === 'MemberExpression' &&
    Opt.contains(staticPropertyName(expression.callee), method)
  );
}

/**
 * The map method of `schema.check(…).mapFields(…)` and friends, unless the call passes `unsafePreserveChecks: true`.
 *
 * @param node Call.
 */
function discardingMethod(node: ESTree.CallExpression): Opt.Option<string> {
  if (node.callee.type !== 'MemberExpression' || !isMethodCall(node.callee.object, 'check')) {
    return Opt.none();
  }

  const preservesChecks = objectArgument(node).pipe(
    Opt.flatMap((options) => objectProperty(options, 'unsafePreserveChecks')),
    Opt.exists((preserve) => isLiteral(preserve.value, true)),
  );

  return preservesChecks ? Opt.none() : Opt.filter(staticPropertyName(node.callee), isSchemaMapMethod);
}

export const noDiscardedSchemaChecks = Rule.define({
  name: 'no-discarded-schema-checks',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow schema mapping that silently drops checks attached to the receiver.',
    messages: {
      discarded:
        '{{method}} creates a new schema and drops the preceding check. Re-attach the check after mapping or explicitly preserve it.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/435',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('CallExpression', (node) =>
      Opt.match(discardingMethod(node), {
        onNone: () => Effect.void,
        onSome: (method) => ctx.report(Diagnostic.fromId({ node, messageId: 'discarded', data: { method } })),
      }),
    );
  },
});
