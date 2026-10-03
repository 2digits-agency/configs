import type { Context, ESTree, Scope } from '@oxlint/plugins';

import { defineSyntaxRule, isGlobalIdentifier, ruleMeta, staticPropertyName, walkNodes } from '../utils';

type Assertion = ESTree.TSAsExpression | ESTree.TSTypeAssertion;
type TypeBindings = Map<ESTree.Node, Map<string, Array<ESTree.Node>>>;
type TargetKind = 'claimed' | 'excluded' | 'unresolved';
type TypeArguments = ReadonlyMap<ESTree.Node, ESTree.TSType>;
type TypePath = ReadonlyArray<{ node: ESTree.Node; substitutions: TypeArguments }>;

function typeContainer(node: ESTree.Node): ESTree.Node {
  let current = node;

  while (
    !['Program', 'BlockStatement', 'TSModuleBlock', 'SwitchStatement', 'ClassDeclaration', 'ClassExpression'].includes(
      current.type,
    ) &&
    current.parent
  ) {
    current = current.parent;
  }

  return current;
}

function collectTypes(program: ESTree.Program): TypeBindings {
  const bindings: TypeBindings = new Map();

  walkNodes(program, (node) => {
    let name: string | undefined;
    let container = typeContainer(node.parent ?? node);

    switch (node.type) {
      case 'TSTypeAliasDeclaration':
      case 'TSInterfaceDeclaration':
      case 'TSEnumDeclaration':
      case 'ClassDeclaration': {
        name = node.id?.name;
        break;
      }
      case 'ClassExpression': {
        name = node.id?.name;
        container = node;
        break;
      }
      case 'TSModuleDeclaration': {
        name = node.id.type === 'Identifier' ? node.id.name : undefined;
        break;
      }
      case 'ImportSpecifier':
      case 'ImportDefaultSpecifier':
      case 'ImportNamespaceSpecifier': {
        name = node.local.name;
        break;
      }
      case 'TSImportEqualsDeclaration': {
        name = node.id.name;
        break;
      }
      case 'TSTypeParameter': {
        name = node.name.name;
        container = node.parent.parent ?? node.parent;
        break;
      }
      default: {
        return;
      }
    }

    if (name === undefined) {
      return;
    }

    const names = bindings.get(container) ?? new Map<string, Array<ESTree.Node>>();

    names.set(name, [...(names.get(name) ?? []), node]);
    bindings.set(container, names);
  });

  return bindings;
}

function resolveType(bindings: TypeBindings, name: string, at: ESTree.Node): Array<ESTree.Node> | undefined {
  let current: ESTree.Node | null = at;

  while (current) {
    const declarations = bindings.get(current)?.get(name);

    if (declarations !== undefined) {
      return declarations;
    }
    current = current.parent;
  }

  return undefined;
}

function classifyTarget(
  initialType: ESTree.TSType,
  bindings: TypeBindings,
  seen: TypePath = [],
  substitutions: TypeArguments = new Map(),
): TargetKind {
  let type = initialType;

  while (type.type === 'TSParenthesizedType') {
    type = type.typeAnnotation;
  }

  if (['TSAnyKeyword', 'TSUnknownKeyword', 'TSVoidKeyword'].includes(type.type)) {
    return 'excluded';
  }
  // The same alias body can appear under different arguments without being recursive.
  const recursive = seen.some(
    (entry) =>
      entry.node === type &&
      entry.substitutions.size === substitutions.size &&
      [...substitutions].every(([parameter, argument]) => entry.substitutions.get(parameter) === argument),
  );

  if (recursive || type.type === 'TSImportType' || type.type === 'TSTypeQuery') {
    return 'unresolved';
  }
  const ancestors = [...seen, { node: type, substitutions }];

  if (type.type !== 'TSTypeReference') {
    return hasUnresolvedNames(type, bindings, ancestors, substitutions) ? 'unresolved' : 'claimed';
  }

  return referenceTarget(type, bindings, ancestors, substitutions);
}

function referenceTarget(
  type: ESTree.TSTypeReference,
  bindings: TypeBindings,
  ancestors: TypePath,
  substitutions: TypeArguments,
): TargetKind {
  if (type.typeName.type !== 'Identifier') {
    return 'unresolved';
  }
  if (type.typeName.name === 'const') {
    return 'excluded';
  }
  if (type.typeArguments && hasUnresolvedNames(type.typeArguments, bindings, ancestors, substitutions)) {
    return 'unresolved';
  }

  const declarations = resolveType(bindings, type.typeName.name, type);
  const declaration = declarations?.length === 1 ? declarations[0] : undefined;

  if (declaration?.type === 'TSTypeAliasDeclaration') {
    const aliasArguments = aliasSubstitutions(type, declaration, substitutions);

    return aliasArguments
      ? classifyTarget(declaration.typeAnnotation, bindings, ancestors, aliasArguments)
      : 'unresolved';
  }
  if (declaration?.type === 'TSTypeParameter') {
    const argument = substitutions.get(declaration);

    return argument ? classifyTarget(argument, bindings, ancestors, substitutions) : 'claimed';
  }

  return declaration &&
    ['TSInterfaceDeclaration', 'ClassDeclaration', 'ClassExpression', 'TSEnumDeclaration'].includes(declaration.type)
    ? 'claimed'
    : 'unresolved';
}

function aliasSubstitutions(
  type: ESTree.TSTypeReference,
  alias: ESTree.TSTypeAliasDeclaration,
  inherited: TypeArguments,
): TypeArguments | undefined {
  const parameters = alias.typeParameters?.params ?? [];
  const arguments_ = type.typeArguments?.params ?? [];
  const substitutions = new Map(inherited);

  if (arguments_.length > parameters.length) {
    return undefined;
  }
  for (const [index, parameter] of parameters.entries()) {
    const argument = arguments_[index] ?? parameter.default;

    if (!argument) {
      return undefined;
    }
    substitutions.set(parameter, argument);
  }

  return substitutions;
}

function hasUnresolvedNames(
  node: ESTree.Node,
  bindings: TypeBindings,
  seen: TypePath,
  substitutions: TypeArguments,
): boolean {
  return walkNodes(node, (child) => {
    if (child.type === 'TSTypeReference') {
      return classifyTarget(child, bindings, seen, substitutions) === 'unresolved';
    }

    return ['TSImportType', 'TSTypeQuery'].includes(child.type);
  });
}

function transparentExpression(node: ESTree.Expression): ESTree.Expression {
  let current = node;

  while (
    current.type === 'ParenthesizedExpression' ||
    current.type === 'TSNonNullExpression' ||
    ((current.type === 'TSAsExpression' || current.type === 'TSTypeAssertion') &&
      ['TSAnyKeyword', 'TSUnknownKeyword', 'TSNeverKeyword'].includes(current.typeAnnotation.type))
  ) {
    current = current.expression;
  }

  return current;
}

function webJsonReader(node: ESTree.Expression, context: Context, types: TypeBindings): boolean {
  if (node.type !== 'AwaitExpression') {
    return false;
  }
  const call = transparentExpression(node.argument);

  if (
    call.type !== 'CallExpression' ||
    call.optional ||
    call.arguments.length > 0 ||
    call.callee.type !== 'MemberExpression' ||
    call.callee.optional ||
    staticPropertyName(call.callee) !== 'json' ||
    call.callee.object.type !== 'Identifier'
  ) {
    return false;
  }

  return builtInWebReceiver(call.callee.object, context, types);
}

function builtInWebReceiver(receiver: ESTree.IdentifierReference, context: Context, types: TypeBindings): boolean {
  let scope: Scope | null = context.sourceCode.getScope(receiver);

  while (scope) {
    const variable = scope.set.get(receiver.name);

    if (variable !== undefined) {
      const definition = variable.defs.length === 1 ? variable.defs[0] : undefined;
      const annotation = definition?.name.typeAnnotation?.typeAnnotation;

      return (
        (definition?.type === 'Parameter' || definition?.type === 'Variable') &&
        variable.references.every((reference) => !reference.isWrite() || reference.init) &&
        annotation?.type === 'TSTypeReference' &&
        annotation.typeName.type === 'Identifier' &&
        !annotation.typeArguments &&
        ['Response', 'Request'].includes(annotation.typeName.name) &&
        resolveType(types, annotation.typeName.name, annotation) === undefined &&
        isGlobalIdentifier(annotation.typeName, context, annotation.typeName.name)
      );
    }

    scope = scope.upper;
  }

  return false;
}

const meta = ruleMeta(
  'problem',
  'Reject unchecked JSON boundary type assertions.',
  {
    unchecked:
      'This assertion gives parsed JSON a claimed type without validating its shape. Decode the boundary with a schema or keep it unknown and narrow it.',
  },
  'https://github.com/2digits-agency/configs/issues/2714',
);

export const noJsonBoundaryTypeAssertion = defineSyntaxRule(
  { ...meta, docs: { ...meta.docs, recommended: false } },
  (context) => {
    let types: TypeBindings = new Map();

    function check(node: Assertion): void {
      if (!/(?<!\.d)\.[cm]?tsx?$/u.test(context.filename) || classifyTarget(node.typeAnnotation, types) !== 'claimed') {
        return;
      }

      // A never intermediate is transparent, but a terminal never is still a claimed type.
      let parent = node.parent;

      while (parent.type === 'ParenthesizedExpression' || parent.type === 'TSNonNullExpression') {
        parent = parent.parent;
      }
      if (
        node.typeAnnotation.type === 'TSNeverKeyword' &&
        (parent.type === 'TSAsExpression' || parent.type === 'TSTypeAssertion')
      ) {
        return;
      }

      const expression = transparentExpression(node.expression);

      if (
        (expression.type === 'CallExpression' &&
          expression.callee.type === 'MemberExpression' &&
          staticPropertyName(expression.callee) === 'parse' &&
          isGlobalIdentifier(expression.callee.object, context, 'JSON')) ||
        webJsonReader(expression, context, types)
      ) {
        context.report({ node, messageId: 'unchecked' });
      }
    }

    return {
      Program(node) {
        types = collectTypes(node);
      },
      TSAsExpression: check,
      TSTypeAssertion: check,
    };
  },
);
