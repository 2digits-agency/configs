import type { Context, ESTree, Scope, Variable } from '@oxlint/plugins';

import {
  defineSyntaxRule,
  isGlobalIdentifier,
  propertyName,
  ruleMeta,
  staticPath,
  staticPropertyName,
  unwrapExpression,
} from '../utils';

function binding(node: ESTree.Node, context: Context): Variable | undefined {
  if (node.type !== 'Identifier') {
    return undefined;
  }
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope !== null) {
    const variable = scope.set.get(node.name);

    if (variable) {
      return variable;
    }
    scope = scope.upper;
  }

  return undefined;
}

function unchanged(variable: Variable): boolean {
  return variable.defs.length === 1 && variable.references.every((reference) => !reference.isWrite() || reference.init);
}

// Type-only declarations are not variables in Oxlint's scope manager. Resolve them in the
// Enclosing statement lists, including declarations that shadow the standard utility types.
function declaresType(node: ESTree.Node, name: string): boolean {
  if (node.type === 'ImportDeclaration') {
    return node.specifiers.some((specifier) => specifier.local.name === name);
  }

  return (
    ['TSTypeAliasDeclaration', 'TSInterfaceDeclaration', 'ClassDeclaration'].includes(node.type) &&
    'id' in node &&
    node.id?.type === 'Identifier' &&
    node.id.name === name
  );
}

function typeDeclaration(name: string, node: ESTree.Node): ESTree.Node | undefined {
  let current: ESTree.Node | undefined = node;

  while (current) {
    if (current.type === 'Program' || current.type === 'BlockStatement') {
      const declaration = current.body
        .map((statement) => (statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement))
        .find((statement) => statement && declaresType(statement, name));

      if (declaration) {
        return declaration;
      }
    }
    if (
      'typeParameters' in current &&
      current.typeParameters?.params.some((parameter) => parameter.name.name === name)
    ) {
      return current;
    }
    current = current.parent ?? undefined;
  }

  return undefined;
}

function openDictionary(type: ESTree.TSType | undefined, context: Context, depth = 0): boolean {
  if (!type || depth > 8) {
    return false;
  }
  if (type.type === 'TSTypeLiteral') {
    return type.members.some(
      (member) =>
        member.type === 'TSIndexSignature' &&
        member.parameters[0]?.typeAnnotation.typeAnnotation.type === 'TSStringKeyword',
    );
  }
  if (type.type !== 'TSTypeReference' || type.typeName.type !== 'Identifier') {
    return false;
  }
  const name = type.typeName.name;
  const declaration = typeDeclaration(name, type);

  if (declaration) {
    return (
      declaration.type === 'TSTypeAliasDeclaration' && openDictionary(declaration.typeAnnotation, context, depth + 1)
    );
  }
  if (!isGlobalIdentifier(type.typeName, context, name)) {
    return false;
  }
  const argument = type.typeArguments?.params[0];

  return (
    (name === 'Record' && argument?.type === 'TSStringKeyword') ||
    (name === 'Readonly' && openDictionary(argument, context, depth + 1))
  );
}

function ordinaryDictionary(node: ESTree.Node, context: Context, operation: 'read' | 'write' = 'read'): boolean {
  const variable = binding(node, context);
  const declaration = variable?.defs[0]?.node;
  const initializer =
    declaration?.type === 'VariableDeclarator' && declaration.init ? unwrapExpression(declaration.init) : undefined;

  return (
    variable !== undefined &&
    unchanged(variable) &&
    declaration?.type === 'VariableDeclarator' &&
    declaration.id.type === 'Identifier' &&
    initializer?.type === 'ObjectExpression' &&
    initializer.properties.every(
      (property) =>
        !(
          property.type === 'Property' &&
          (operation === 'write' ||
            (!property.computed && !property.shorthand && !property.method && property.kind === 'init')) &&
          propertyName(property) === '__proto__'
        ),
    ) &&
    openDictionary(declaration.id.typeAnnotation?.typeAnnotation, context)
  );
}

function entrySource(pattern: ESTree.ArrayPattern | ESTree.ArrayAssignmentTarget): ESTree.Node | undefined {
  if (pattern.parent.type === 'VariableDeclarator') {
    const loop = pattern.parent.parent.parent;

    if (loop?.type === 'ForOfStatement') {
      return loop.right;
    }
  } else if (pattern.parent.type === 'ArrowFunctionExpression' || pattern.parent.type === 'FunctionExpression') {
    const callback = pattern.parent;
    const call = callback.parent;

    if (
      callback.params[0] === pattern &&
      call.type === 'CallExpression' &&
      call.arguments[0] === callback &&
      call.callee.type === 'MemberExpression' &&
      ['forEach', 'map'].includes(staticPropertyName(call.callee) ?? '')
    ) {
      return call.callee.object;
    }
  }

  return undefined;
}

function entriesKey(variable: Variable, context: Context, depth: number): boolean {
  const definition = variable.defs[0];
  const pattern = definition?.name.parent;

  if (pattern?.type !== 'ArrayPattern' || pattern.elements[0] !== definition?.name) {
    return false;
  }
  const entries = entrySource(pattern);

  if (
    entries?.type !== 'CallExpression' ||
    entries.callee.type !== 'MemberExpression' ||
    staticPropertyName(entries.callee) !== 'entries' ||
    !isGlobalIdentifier(entries.callee.object, context, 'Object')
  ) {
    return false;
  }

  return openEntriesSource(entries.arguments[0], context, depth + 1);
}

function openEntriesSource(source: ESTree.Node | undefined, context: Context, depth = 0): boolean {
  if (depth > 8) {
    return false;
  }
  const sourceVariable = source ? binding(source, context) : undefined;
  const sourceDefinition = sourceVariable?.defs[0];

  if (!sourceVariable || !sourceDefinition || !unchanged(sourceVariable)) {
    return false;
  }
  if (sourceDefinition.type === 'Parameter') {
    return openDictionary(sourceDefinition.name.typeAnnotation?.typeAnnotation, context);
  }
  const declaration = sourceDefinition.node;

  return (
    declaration.type === 'VariableDeclarator' &&
    declaration.id.type === 'Identifier' &&
    openDictionary(declaration.id.typeAnnotation?.typeAnnotation, context) &&
    declaration.init !== null &&
    openEntriesInitializer(unwrapExpression(declaration.init), context, depth)
  );
}

function openEntriesInitializer(node: ESTree.Expression, context: Context, depth: number): boolean {
  if (node.type !== 'ObjectExpression') {
    return true;
  }

  return node.properties.some(
    (property) =>
      (property.type === 'SpreadElement' && openEntriesSource(property.argument, context, depth + 1)) ||
      (property.type === 'Property' && property.computed && openKey(property.key, context, depth + 1)),
  );
}

function openStringType(type: ESTree.TSType | undefined): boolean {
  return (
    type?.type === 'TSStringKeyword' ||
    (type?.type === 'TSUnionType' &&
      type.types.some((member) => member.type === 'TSStringKeyword') &&
      type.types.every((member) => ['TSStringKeyword', 'TSNullKeyword', 'TSUndefinedKeyword'].includes(member.type)))
  );
}

function openKey(node: ESTree.Node, context: Context, startingDepth = 0): boolean {
  let current = node;

  for (let depth = startingDepth; depth <= 8; depth++) {
    if (
      current.type === 'CallExpression' &&
      current.callee.type === 'MemberExpression' &&
      ['trim', 'trimStart', 'trimEnd', 'toLowerCase', 'normalize'].includes(staticPropertyName(current.callee) ?? '')
    ) {
      current = current.callee.object;
      continue;
    }
    const variable = binding(current, context);
    const definition = variable?.defs[0];

    if (!variable || !definition || !unchanged(variable)) {
      return false;
    }
    if (entriesKey(variable, context, depth)) {
      return true;
    }
    if (definition.type === 'Parameter') {
      return openStringType(definition.name.typeAnnotation?.typeAnnotation);
    }
    const declaration = definition.node;

    if (
      declaration.type !== 'VariableDeclarator' ||
      declaration.id.type !== 'Identifier' ||
      !declaration.init ||
      (declaration.id.typeAnnotation && declaration.id.typeAnnotation.typeAnnotation.type !== 'TSStringKeyword')
    ) {
      return false;
    }
    current = unwrapExpression(declaration.init);
  }

  return false;
}

function isUndefined(node: ESTree.Node, context: Context): boolean {
  return (
    isGlobalIdentifier(node, context, 'undefined') || (node.type === 'UnaryExpression' && node.operator === 'void')
  );
}

function presenceRead(node: ESTree.Node, context: Context): boolean {
  const parent = node.parent;

  if (!parent) {
    return false;
  }
  if (
    (parent.type === 'LogicalExpression' && parent.operator === '??' && parent.left === node) ||
    (parent.type === 'BinaryExpression' &&
      ['==', '===', '!=', '!=='].includes(parent.operator) &&
      isUndefined(parent.left === node ? parent.right : parent.left, context))
  ) {
    return true;
  }
  if (parent.type === 'VariableDeclarator' && parent.init === node && parent.id.type === 'Identifier') {
    const variable = binding(parent.id, context);

    return (
      variable !== undefined &&
      unchanged(variable) &&
      variable.references.some(
        (reference) =>
          reference.isRead() &&
          reference.identifier.parent.type !== 'VariableDeclarator' &&
          presenceRead(reference.identifier, context),
      )
    );
  }

  return false;
}

function assignmentTarget(node: ESTree.Node): boolean {
  let current = node;

  while (current.parent) {
    const parent = current.parent;

    if (
      parent.type === 'ArrayPattern' ||
      parent.type === 'ObjectPattern' ||
      (parent.type === 'Property' && parent.value === current) ||
      (parent.type === 'AssignmentPattern' && parent.left === current) ||
      (parent.type === 'RestElement' && parent.argument === current)
    ) {
      current = parent;
      continue;
    }

    return (
      (parent.type === 'AssignmentExpression' && parent.left === current) ||
      ((parent.type === 'ForOfStatement' || parent.type === 'ForInStatement') && parent.left === current) ||
      (parent.type === 'UpdateExpression' && parent.argument === current)
    );
  }

  return false;
}

function sameBinding(left: ESTree.Node | undefined, right: ESTree.Node, context: Context): boolean {
  const variable = left ? binding(left, context) : undefined;

  return variable !== undefined && variable === binding(right, context);
}

function safeName(name: string): boolean {
  return ![
    '__proto__',
    'constructor',
    'toString',
    'toLocaleString',
    'valueOf',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
  ].includes(name);
}

function safeLiteral(node: ESTree.Node | null): boolean {
  return node?.type === 'Literal' && typeof node.value === 'string' && safeName(node.value);
}

function guard(
  condition: ESTree.Expression,
  truth: boolean,
  object: ESTree.Node,
  key: ESTree.Node,
  own: boolean,
  context: Context,
): boolean {
  let node = unwrapExpression(condition);
  let positive = truth;

  while (node.type === 'UnaryExpression' && node.operator === '!') {
    positive = !positive;
    node = unwrapExpression(node.argument);
  }
  if (node.type === 'LogicalExpression' && ['&&', '||'].includes(node.operator)) {
    const left = guard(node.left, positive, object, key, own, context);
    const right = guard(node.right, positive, object, key, own, context);

    return node.operator === (positive ? '&&' : '||') ? left || right : left && right;
  }
  if (!own && node.type === 'BinaryExpression') {
    return literalWhitelist(node, positive, key, context);
  }
  if (!positive || node.type !== 'CallExpression') {
    return false;
  }

  return own ? ownKeyGuard(node, object, key, context) : whitelist(node, key, context);
}

function literalWhitelist(
  node: ESTree.BinaryExpression | ESTree.PrivateInExpression,
  positive: boolean,
  key: ESTree.Node,
  context: Context,
): boolean {
  if (!['===', '!=='].includes(node.operator) || positive !== (node.operator === '===')) {
    return false;
  }
  const literal = node.left.type === 'Literal' ? node.left : node.right;
  const candidate = node.left === literal ? node.right : node.left;

  return safeLiteral(literal) && sameBinding(candidate, key, context);
}

function whitelist(node: ESTree.CallExpression, key: ESTree.Node, context: Context): boolean {
  if (node.callee.type !== 'MemberExpression' || staticPropertyName(node.callee) !== 'includes') {
    return false;
  }
  let list = unwrapExpression(node.callee.object);
  const variable = binding(list, context);
  const declaration = variable?.defs[0]?.node;

  if (variable && unchanged(variable) && declaration?.type === 'VariableDeclarator' && declaration.init) {
    if (
      !variable.references.every((reference) => {
        if (reference.init) {
          return true;
        }
        const parent = reference.identifier.parent;

        return (
          parent.type === 'MemberExpression' &&
          parent.object === reference.identifier &&
          staticPropertyName(parent) === 'includes' &&
          parent.parent.type === 'CallExpression' &&
          parent.parent.callee === parent
        );
      })
    ) {
      return false;
    }
    list = unwrapExpression(declaration.init);
  }

  return (
    list.type === 'ArrayExpression' &&
    list.elements.every((element) => safeLiteral(element)) &&
    sameBinding(node.arguments[0], key, context)
  );
}

function ownKeyGuard(node: ESTree.CallExpression, object: ESTree.Node, key: ESTree.Node, context: Context): boolean {
  const path = staticPath(node.callee);
  let root: ESTree.Expression = node.callee;

  while (root.type === 'MemberExpression') {
    root = root.object;
  }

  return (
    isGlobalIdentifier(root, context, 'Object') &&
    (path?.join('.') === 'Object.hasOwn' || path?.join('.') === 'Object.prototype.hasOwnProperty.call') &&
    sameBinding(node.arguments[0], object, context) &&
    sameBinding(node.arguments[1], key, context)
  );
}

function exits(node: ESTree.Statement): boolean {
  if (node.type === 'BlockStatement') {
    const last = node.body.at(-1);

    return last !== undefined && exits(last);
  }

  return (
    node.type === 'ReturnStatement' ||
    node.type === 'ThrowStatement' ||
    (node.type === 'ContinueStatement' && !node.label)
  );
}

function deletedSince(condition: ESTree.Node, node: ESTree.Node, object: ESTree.Node, context: Context): boolean {
  return (
    binding(object, context)?.references.some((reference) => {
      const member = reference.identifier.parent;

      if (
        member.type !== 'MemberExpression' ||
        member.object !== reference.identifier ||
        member.parent.type !== 'UnaryExpression' ||
        member.parent.operator !== 'delete' ||
        member.range[0] < condition.range[1] ||
        member.range[0] > node.range[0]
      ) {
        return false;
      }
      const name = staticPropertyName(member);

      return name === undefined || !safeName(name);
    }) ?? false
  );
}

function precedingExitCondition(node: ESTree.Node): ESTree.Expression | undefined {
  const parent = node.parent;

  if (parent?.type !== 'BlockStatement') {
    return undefined;
  }
  const index = parent.body.indexOf(node as ESTree.Statement);
  const previous = parent.body[index - 1];

  return previous?.type === 'IfStatement' && !previous.alternate && exits(previous.consequent)
    ? previous.test
    : undefined;
}

function guarded(node: ESTree.Node, object: ESTree.Node, key: ESTree.Node, own: boolean, context: Context): boolean {
  let current = node;

  while (current.parent) {
    const parent = current.parent;

    if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(parent.type)) {
      break;
    }
    if (
      (parent.type === 'IfStatement' || parent.type === 'ConditionalExpression') &&
      current !== parent.test &&
      guard(parent.test, current === parent.consequent, object, key, own, context) &&
      (!own || !deletedSince(parent.test, node, object, context))
    ) {
      return true;
    }
    if (
      parent.type === 'LogicalExpression' &&
      current === parent.right &&
      ['&&', '||'].includes(parent.operator) &&
      guard(parent.left, parent.operator === '&&', object, key, own, context) &&
      (!own || !deletedSince(parent.left, node, object, context))
    ) {
      return true;
    }
    const preceding = precedingExitCondition(current);

    if (
      preceding &&
      guard(preceding, false, object, key, own, context) &&
      (!own || !deletedSince(preceding, node, object, context))
    ) {
      return true;
    }
    current = parent;
  }

  return false;
}

const meta = ruleMeta(
  'problem',
  'Prevent prototype collisions in dynamic string dictionaries.',
  {
    unsafeRead:
      'An open string key can read inherited properties instead of the fallback. Use an own-key guard, a null-prototype dictionary, or Map.',
    unsafeWrite:
      'An open string key can invoke the __proto__ setter. Use a null-prototype dictionary, Map, or a safe define-property API.',
  },
  'https://github.com/2digits-agency/configs/issues/2712',
);

export const noUnsafeDynamicRecordKey = defineSyntaxRule(
  { ...meta, docs: { ...meta.docs, recommended: false } },
  (context) => ({
    MemberExpression(node) {
      const write = assignmentTarget(node);

      if (
        !node.computed ||
        !ordinaryDictionary(node.object, context, write ? 'write' : 'read') ||
        !openKey(node.property, context) ||
        guarded(node, node.object, node.property, false, context)
      ) {
        return;
      }

      if (write) {
        context.report({ node, messageId: 'unsafeWrite' });
      } else if (presenceRead(node, context) && !guarded(node, node.object, node.property, true, context)) {
        context.report({ node, messageId: 'unsafeRead' });
      }
    },
    BinaryExpression(node) {
      if (
        node.operator === 'in' &&
        ordinaryDictionary(node.right, context) &&
        openKey(node.left, context) &&
        !guarded(node, node.right, node.left, false, context) &&
        !guarded(node, node.right, node.left, true, context)
      ) {
        context.report({ node, messageId: 'unsafeRead' });
      }
    },
  }),
);
