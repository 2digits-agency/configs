import type { Context, ESTree, Rule, Scope, Variable } from '@oxlint/plugins';

import { defineEffectRule, type FileState, ruleMeta, staticPropertyName } from '../../utils';

// Unlike unwrapExpression, only parentheses are harmless for this syntax-only rule.
function unparenthesize(node: ESTree.Node): ESTree.Node {
  return node.type === 'ParenthesizedExpression' ? unparenthesize(node.expression) : node;
}

function outerParentheses(node: ESTree.Node): ESTree.Node {
  return node.parent?.type === 'ParenthesizedExpression' ? outerParentheses(node.parent) : node;
}

function variableAt(node: Extract<ESTree.Node, { type: 'Identifier' }>, context: Context): Variable | undefined {
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

function schemaApi(node: ESTree.Node, member: string, context: Context, state: FileState): boolean {
  const path: Array<string> = [];
  let root = unparenthesize(node);

  while (root.type === 'MemberExpression' && !root.optional) {
    const property = staticPropertyName(root);

    if (property === undefined) {
      return false;
    }
    path.unshift(property);
    root = unparenthesize(root.object);
  }
  if (root.type !== 'Identifier') {
    return false;
  }
  const definition = variableAt(root, context)?.defs[0];
  const declaration = definition?.parent;

  if (
    definition?.type !== 'ImportBinding' ||
    declaration?.type !== 'ImportDeclaration' ||
    !['effect', 'effect/Schema'].includes(declaration.source.value) ||
    declaration.importKind === 'type' ||
    definition.node.type === 'ImportDefaultSpecifier' ||
    (definition.node.type === 'ImportSpecifier' && definition.node.importKind === 'type')
  ) {
    return false;
  }
  const canonical = [...(state.bindings.get(root.name) ?? []), ...path];

  return canonical.length === 2 && canonical[0] === 'Schema' && canonical[1] === member;
}

function escapesTuple(node: ESTree.Node): boolean {
  let expression = outerParentheses(node);

  while (expression.parent) {
    const parent = expression.parent;

    switch (parent.type) {
      case 'Property': {
        if (parent.value !== expression || parent.parent.type !== 'ObjectExpression') {
          return false;
        }
        expression = outerParentheses(parent.parent);
        break;
      }
      case 'ArrayExpression': {
        expression = outerParentheses(parent);
        break;
      }
      case 'ReturnStatement': {
        return parent.argument === expression;
      }
      case 'ArrowFunctionExpression': {
        return parent.body === expression;
      }
      case 'AssignmentExpression': {
        return parent.right === expression && parent.left.type === 'MemberExpression';
      }
      case 'CallExpression':
      case 'NewExpression': {
        return parent.arguments.includes(expression as ESTree.Expression);
      }
      default: {
        return false;
      }
    }
  }

  return false;
}

function decodedTuple(node: ESTree.Node, context: Context, state: FileState): ESTree.CallExpression | undefined {
  const expression = outerParentheses(node);
  const decode = expression.parent;

  if (
    decode?.type !== 'CallExpression' ||
    decode.optional ||
    decode.arguments[0] !== expression ||
    !schemaApi(decode.callee, 'decodeUnknownSync', context, state)
  ) {
    return undefined;
  }
  const decoder = outerParentheses(decode);
  const invocation = decoder.parent;

  return invocation?.type === 'CallExpression' && !invocation.optional && invocation.callee === decoder
    ? invocation
    : undefined;
}

function extractionConsumers(
  node: ESTree.CallExpression,
  context: Context,
  state: FileState,
): Array<ESTree.CallExpression> {
  const direct = decodedTuple(node, context, state);

  if (direct !== undefined) {
    return [direct];
  }
  const expression = outerParentheses(node);
  const declarator = expression.parent;

  if (
    declarator?.type !== 'VariableDeclarator' ||
    declarator.init !== expression ||
    declarator.id.type !== 'Identifier' ||
    declarator.parent.type !== 'VariableDeclaration' ||
    declarator.parent.kind !== 'const' ||
    declarator.parent.parent.type === 'ExportNamedDeclaration'
  ) {
    return [];
  }
  const variable = variableAt(declarator.id, context);
  const consumers: Array<ESTree.CallExpression> = [];
  const references = variable?.references ?? [];

  for (const reference of references) {
    if (reference.isWrite()) {
      if (!reference.init) {
        return [];
      }
      continue;
    }
    const tuple = decodedTuple(reference.identifier, context, state);

    if (tuple !== undefined) {
      consumers.push(tuple);
      continue;
    }
    // Validation and encoding can coexist with extraction. Any other use (including aliases
    // And exports) leaves the parser's identity/consumer unresolved in this first slice.
    const use = outerParentheses(reference.identifier);
    const call = use.parent;

    if (
      call?.type !== 'CallExpression' ||
      call.arguments[0] !== use ||
      ['is', 'encodeSync', 'encodeUnknownSync'].every((member) => !schemaApi(call.callee, member, context, state))
    ) {
      return [];
    }
  }

  return consumers;
}

function referencedSlot(pattern: ESTree.ArrayPattern, index: number, context: Context): boolean {
  const slot = pattern.elements[index];
  const binding = slot?.type === 'AssignmentPattern' ? slot.left : slot;

  if (binding?.type !== 'Identifier' || binding.name.startsWith('_')) {
    return false;
  }
  const references = variableAt(binding, context)?.references ?? [];

  return (
    references.some((reference) => reference.isRead()) &&
    references.every((reference) => !reference.isWrite() || reference.init)
  );
}

function consumesPair(tuple: ESTree.CallExpression, secondIndex: number, context: Context): boolean {
  if (escapesTuple(tuple)) {
    return true;
  }
  const expression = outerParentheses(tuple);
  const declarator = expression.parent;

  if (declarator?.type !== 'VariableDeclarator' || declarator.init !== expression) {
    return false;
  }
  if (declarator.id.type === 'ArrayPattern') {
    return (
      referencedSlot(declarator.id, secondIndex - 1, context) && referencedSlot(declarator.id, secondIndex, context)
    );
  }
  if (declarator.id.type !== 'Identifier' || declarator.id.name.startsWith('_')) {
    return false;
  }
  if (declarator.parent.parent?.type === 'ExportNamedDeclaration') {
    return true;
  }
  const references = variableAt(declarator.id, context)?.references ?? [];

  return (
    references.every((reference) => !reference.isWrite() || reference.init) &&
    references.some((reference) => reference.isRead() && escapesTuple(reference.identifier))
  );
}

export const noAmbiguousTemplateLiteralCaptures: Rule = defineEffectRule(
  {
    ...ruleMeta('problem', 'Disallow ambiguous adjacent String captures used for extraction.', {
      ambiguous:
        'These extracted String parts have no boundary; one capture may be empty. Use a domain separator or constrained part if both captures matter.',
    }),
    docs: {
      description: 'Disallow ambiguous adjacent String captures used for extraction.',
      recommended: false,
      url: 'https://github.com/2digits-agency/configs/issues/2731',
    },
  },
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();
      const parts = node.arguments[0];

      if (parts === undefined || node.optional || !schemaApi(node.callee, 'TemplateLiteralParser', context, state)) {
        return;
      }
      const array = unparenthesize(parts);

      if (array.type !== 'ArrayExpression' || array.elements.some((part) => part?.type === 'SpreadElement')) {
        return;
      }
      const consumers = extractionConsumers(node, context, state);

      if (consumers.length === 0) {
        return;
      }
      for (let index = 1; index < array.elements.length; index++) {
        const first = array.elements[index - 1];
        const second = array.elements[index];

        if (
          first &&
          second &&
          schemaApi(first, 'String', context, state) &&
          schemaApi(second, 'String', context, state) &&
          consumers.some((tuple) => consumesPair(tuple, index, context))
        ) {
          context.report({ node: unparenthesize(second), messageId: 'ambiguous' });
        }
      }
    },
  }),
);
