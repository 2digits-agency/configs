import type { Context, ESTree, Rule, Scope, Variable } from '@oxlint/plugins';

import { argumentAt, defineSyntaxRule, propertyName, ruleMeta, staticPropertyName } from '../utils';

function isMemberWrite(node: ESTree.Node): boolean {
  const member = node.parent;

  if (member?.type !== 'MemberExpression' || member.object !== node) {
    return false;
  }
  const parent = member.parent;

  return (
    (parent.type === 'AssignmentExpression' && parent.left === member) ||
    parent.type === 'UpdateExpression' ||
    (parent.type === 'UnaryExpression' && parent.operator === 'delete')
  );
}

function isPlainLiteral(node: ESTree.Expression): boolean {
  if (node.type === 'ArrayExpression') {
    return node.elements.every((element) => element?.type !== 'SpreadElement');
  }

  return (
    node.type === 'ObjectExpression' &&
    node.properties.every(
      (property) =>
        property.type === 'Property' &&
        !property.computed &&
        !property.method &&
        property.kind === 'init' &&
        propertyName(property) !== '__proto__',
    )
  );
}

function binding(context: Context, node: ESTree.IdentifierReference): Variable | undefined {
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope !== null) {
    const variable = scope.set.get(node.name);

    if (variable !== undefined) {
      return variable;
    }
    scope = scope.upper;
  }

  return undefined;
}

function nativeConstructor(context: Context, receiver: ESTree.IdentifierReference): string | undefined {
  const variable = binding(context, receiver);
  const definition = variable?.defs[0];

  if (
    variable?.defs.length !== 1 ||
    definition?.type !== 'Variable' ||
    definition.node.type !== 'VariableDeclarator' ||
    definition.node.id.type !== 'Identifier' ||
    variable.references.some(
      (reference) => (reference.isWrite() && !reference.init) || isMemberWrite(reference.identifier),
    )
  ) {
    return undefined;
  }
  const initializer = definition.node.init;

  if (
    initializer?.type !== 'NewExpression' ||
    initializer.callee.type !== 'Identifier' ||
    !['Map', 'Set', 'WeakMap', 'WeakSet'].includes(initializer.callee.name)
  ) {
    return undefined;
  }
  const name = initializer.callee.name;
  const constructorBinding = binding(context, initializer.callee);

  if (
    // Configured native globals have no source definitions; parameters/imports/locals do.
    (constructorBinding !== undefined &&
      (constructorBinding.defs.length > 0 || constructorBinding.references.some((reference) => reference.isWrite()))) ||
    context.sourceCode.scopeManager.globalScope?.through.some(
      (reference) => reference.identifier.name === name && reference.isWrite(),
    )
  ) {
    return undefined;
  }

  return name;
}

export const noFreshNativeCollectionLookupKey: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    'Disallow fresh literal lookup keys in native collections.',
    {
      freshKey:
        'A fresh object or array cannot match a stored native collection key. Reuse a stable key or choose a value-key design.',
    },
    'https://github.com/2digits-agency/configs/issues/2729',
  ),
  (context) => ({
    CallExpression(node) {
      if (node.callee.type !== 'MemberExpression' || node.callee.object.type !== 'Identifier') {
        return;
      }
      const method = staticPropertyName(node.callee);

      if (method !== 'has' && method !== 'delete' && method !== 'get') {
        return;
      }
      const key = argumentAt(node, 0);

      if (key === undefined || !isPlainLiteral(key)) {
        return;
      }
      const constructor = nativeConstructor(context, node.callee.object);

      if (constructor === undefined || (method === 'get' && !['Map', 'WeakMap'].includes(constructor))) {
        return;
      }
      context.report({ node: key, messageId: 'freshKey' });
    },
  }),
);
