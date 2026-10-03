import type { Context, ESTree, Rule, Scope } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, type FunctionNode, isApi, isFunctionNode, ruleMeta } from '../../utils';
import { isTypeOnlyImport } from './import-style-utils';

function hasImportedRoot(callee: ESTree.Node, context: Context): boolean {
  let root = callee;

  while (root.type === 'MemberExpression' || root.type === 'ChainExpression') {
    root = root.type === 'MemberExpression' ? root.object : root.expression;
  }
  if (root.type !== 'Identifier') {
    return false;
  }
  let scope: Scope | null = context.sourceCode.getScope(root);

  while (scope) {
    const variable = scope.set.get(root.name);

    if (variable !== undefined) {
      return (
        variable.defs.some(
          (definition) =>
            definition.type === 'ImportBinding' &&
            definition.parent?.type === 'ImportDeclaration' &&
            !isTypeOnlyImport(
              definition.parent,
              definition.node.type === 'ImportSpecifier' ? definition.node : undefined,
            ),
        ) && variable.references.some((reference) => reference.identifier === root)
      );
    }
    scope = scope.upper;
  }

  return false;
}

function isSpanPattern(parameter: ESTree.Node): boolean {
  switch (parameter.type) {
    case 'Identifier': {
      return true;
    }
    case 'ObjectPattern': {
      return parameter.properties.every(
        (property) => property.type === 'Property' && !property.computed && isSpanPattern(property.value),
      );
    }
    case 'ArrayPattern': {
      return parameter.elements.every((element) => !element || isSpanPattern(element));
    }
    default: {
      return false;
    }
  }
}

function ignoresSpan(callback: FunctionNode, context: Context): boolean {
  const parameter = callback.params[0];

  if (parameter === undefined) {
    return true;
  }
  if (!isSpanPattern(parameter)) {
    return false;
  }
  const variables = context.sourceCode
    .getDeclaredVariables(callback)
    .filter((variable) =>
      variable.identifiers.some(
        (identifier) => identifier.range[0] >= parameter.range[0] && identifier.range[1] <= parameter.range[1],
      ),
    );

  return variables.every((variable) => variable.references.length === 0);
}

export const preferWithSpan: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect.withSpan when the callback does not use the span handle.',
    {
      unusedSpan:
        'The useSpan callback ignores its span. Use Effect.withSpan so nested spans are parented beneath this span.',
    },
    'https://github.com/Effect-TS/tsgo/issues/663',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (
        (node.arguments.length !== 2 && node.arguments.length !== 3) ||
        node.arguments.some((argument) => argument.type === 'SpreadElement') ||
        !isApi(node.callee, getState(), 'Effect', 'useSpan') ||
        !hasImportedRoot(node.callee, context)
      ) {
        return;
      }

      const callback = argumentAt(node, node.arguments.length - 1);

      if (callback !== undefined && isFunctionNode(callback) && ignoresSpan(callback, context)) {
        context.report({ node, messageId: 'unusedSpan' });
      }
    },
  }),
);
