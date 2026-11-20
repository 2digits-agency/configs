import type { ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { argumentAt, staticPropertyName, unwrapExpression } from '../../../internal/ast';
import { NumberMethod, NumberPreservingStepName, NumberSchemaName, SchemaWrapper } from '../../../schemas/effect';
import type { ImportBindings } from '../../../schemas/imports';

const isNumberSchemaName = Schema.is(NumberSchemaName);

const isSchemaWrapper = Schema.is(SchemaWrapper);

const isNumberPreservingStepName = Schema.is(NumberPreservingStepName);

const isNumberMethod = Schema.is(NumberMethod);

function schemaApiName(node: ESTree.Node, imports: ImportBindings): Opt.Option<string> {
  return imports.member(node, 'Schema');
}

function isNumberPreservingStep(node: ESTree.Argument, imports: ImportBindings): boolean {
  if (node.type === 'SpreadElement') {
    return false;
  }

  const step = unwrapExpression(node);

  return step.type === 'CallExpression'
    ? Opt.exists(schemaApiName(step.callee, imports), isNumberPreservingStepName)
    : Opt.exists(schemaApiName(step, imports), isSchemaWrapper);
}

/**
 * The plain number schema a schema decodes with: `Number` for `Schema.Number`, and the same for `Schema.Finite`,
 * `Schema.Int`, `Schema.NumberFromString` and `Schema.FiniteFromString` wrapped in `optional`, `NullOr` and similar,
 * refined with `.check(...)`, or piped only through modifiers, checks, brands, annotations and defaults.
 *
 * @param node Field schema.
 * @param imports Import bindings of the file.
 */
export function numberSchemaName(
  node: ESTree.Expression,
  imports: ImportBindings,
): Opt.Option<typeof NumberSchemaName.Type> {
  const expression = unwrapExpression(node);

  if (expression.type !== 'CallExpression') {
    return Opt.filter(schemaApiName(expression, imports), isNumberSchemaName);
  }

  const callee = expression.callee;

  if (Opt.exists(schemaApiName(callee, imports), isSchemaWrapper)) {
    return Opt.flatMap(argumentAt(expression, 0), (first) => numberSchemaName(first, imports));
  }

  if (callee.type !== 'MemberExpression' || callee.object.type === 'Super') {
    return Opt.none();
  }

  const preserved = Opt.exists(staticPropertyName(callee), (method) =>
    method === 'pipe'
      ? Arr.every(expression.arguments, (step) => isNumberPreservingStep(step, imports))
      : isNumberMethod(method),
  );

  return preserved ? numberSchemaName(callee.object, imports) : Opt.none();
}
