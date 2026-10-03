import type { Context, ESTree, Rule, Scope, Variable } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import {
  argumentAt,
  defineEffectRule,
  isApi,
  isFunctionNode,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
} from '../../utils';

function resolveConst(node: ESTree.Expression, context: Context): ESTree.Expression | undefined {
  let expression = unwrapExpression(node);
  const seen = new Set<Variable>();

  while (expression.type === 'Identifier') {
    let scope: Scope | null = context.sourceCode.getScope(expression);

    while (scope !== null && !scope.set.has(expression.name)) {
      scope = scope.upper;
    }
    const variable = scope?.set.get(expression.name);
    const definition = variable?.defs.length === 1 ? variable.defs[0] : undefined;
    const declaration = definition?.node;

    if (
      variable === undefined ||
      seen.has(variable) ||
      declaration?.type !== 'VariableDeclarator' ||
      declaration.id.type !== 'Identifier' ||
      definition?.parent?.type !== 'VariableDeclaration' ||
      definition.parent.kind !== 'const' ||
      !declaration.init ||
      variable.references.some((reference) => reference.isWrite() && !reference.init)
    ) {
      return undefined;
    }
    seen.add(variable);
    expression = unwrapExpression(declaration.init);
  }

  return expression;
}

function receivingConfig(node: ESTree.CallExpression): ESTree.Expression | undefined {
  if (node.arguments.length === 2) {
    return argumentAt(node, 0);
  }
  const parent = node.parent;

  // Earlier pipe operations may change the success value, so only prove the first operation.
  if (
    node.arguments.length === 1 &&
    parent.type === 'CallExpression' &&
    parent.arguments[0] === node &&
    parent.callee.type === 'MemberExpression' &&
    staticPropertyName(parent.callee) === 'pipe'
  ) {
    return parent.callee.object;
  }

  return undefined;
}

export const noFunctionConfigDefault: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow obsolete lazy callbacks passed to the now-eager Config.withDefault API.',
    {
      functionDefault:
        'Config.withDefault takes an eager value. This callback becomes the configured value; pass the returned value directly.',
    },
    'https://github.com/Effect-TS/tsgo/issues/408',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!isApi(node.callee, getState(), 'Config', 'withDefault') || !importedApi(context, node.callee)) {
        return;
      }

      const fallback = argumentAt(node, node.arguments.length - 1);
      const config = receivingConfig(node);
      const receiver = config === undefined ? undefined : resolveConst(config, context);

      if (
        receiver?.type === 'CallExpression' &&
        isApi(receiver.callee, getState(), 'Config', 'succeed') &&
        importedApi(context, receiver.callee) &&
        isFunctionNode(argumentAt(receiver, 0))
      ) {
        return;
      }

      if (fallback !== undefined && isFunctionNode(fallback) && fallback.params.length === 0) {
        context.report({ node: fallback, messageId: 'functionDefault' });
      }
    },
  }),
);
