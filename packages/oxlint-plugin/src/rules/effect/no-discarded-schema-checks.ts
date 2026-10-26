import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import type * as Schema from 'effect/Schema';

import {
  defineEffectRule,
  isLiteral,
  objectProperty,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
} from '../../utils';

const schemaMapMethods: ReadonlySet<string> = new Set([
  'mapElements',
  'mapFields',
  'mapMembers',
] satisfies ReadonlyArray<
  | keyof Schema.Struct<Schema.Struct.Fields>
  | keyof Schema.Tuple<Schema.Tuple.Elements>
  | keyof Schema.Union<ReadonlyArray<Schema.Constraint>>
>);

function methodCall(node: ESTree.Expression, method: string): ESTree.CallExpression | undefined {
  const expression = unwrapExpression(node);

  if (
    expression.type === 'CallExpression' &&
    expression.callee.type === 'MemberExpression' &&
    staticPropertyName(expression.callee) === method
  ) {
    return expression;
  }

  return undefined;
}

export const noDiscardedSchemaChecks: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow schema mapping that silently drops checks attached to the receiver.',
    {
      discarded:
        '{{method}} creates a new schema and drops the preceding check. Re-attach the check after mapping or explicitly preserve it.',
    },
    'https://github.com/Effect-TS/tsgo/issues/435',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!getState().hasEffectImport || node.callee.type !== 'MemberExpression') {
        return;
      }

      const method = staticPropertyName(node.callee);

      if (
        method === undefined ||
        !schemaMapMethods.has(method) ||
        methodCall(node.callee.object, 'check') === undefined
      ) {
        return;
      }

      const preservesChecks = Arr.findFirst(node.arguments, (argument) => argument.type === 'ObjectExpression').pipe(
        Opt.flatMapNullishOr((options) => objectProperty(options, 'unsafePreserveChecks')),
        Opt.exists((preserve) => isLiteral(preserve.value, true)),
      );

      if (preservesChecks) {
        return;
      }

      context.report({ node, messageId: 'discarded', data: { method } });
    },
  }),
);
