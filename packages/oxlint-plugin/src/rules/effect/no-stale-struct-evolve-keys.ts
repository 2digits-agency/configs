import type { Context, ESTree, Rule, Scope } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, isApiPath, type FileState } from '../../utils';
import { isTypeOnlyImport } from './import-style-utils';

function isImportedApi(context: Context, node: ESTree.Node, state: FileState, path: ReadonlyArray<string>): boolean {
  if (!isApiPath(node, state, path)) {
    return false;
  }
  let root = node;

  while (root.type === 'MemberExpression' && !root.optional) {
    root = root.object;
  }
  if (root.type !== 'Identifier') {
    return false;
  }
  let scope: Scope | null = context.sourceCode.getScope(root);

  while (scope !== null) {
    const variable = scope.set.get(root.name);

    if (variable !== undefined) {
      const definition = variable.defs[0];
      const declaration = definition?.parent;
      const specifier = definition?.node;

      return (
        variable.defs.length === 1 &&
        definition?.type === 'ImportBinding' &&
        declaration?.type === 'ImportDeclaration' &&
        specifier?.type !== 'ImportDefaultSpecifier' &&
        !isTypeOnlyImport(declaration, specifier?.type === 'ImportSpecifier' ? specifier : undefined) &&
        (declaration.source.value === 'effect' || declaration.source.value === `effect/${path[0]}`)
      );
    }
    scope = scope.upper;
  }

  return false;
}

function literalKeys(node: ESTree.Expression | undefined): Map<string, ESTree.ObjectProperty> | undefined {
  if (node?.type !== 'ObjectExpression') {
    return undefined;
  }

  const keys = new Map<string, ESTree.ObjectProperty>();

  for (const property of node.properties) {
    if (property.type !== 'Property' || property.computed || property.kind !== 'init') {
      return undefined;
    }
    const key = property.key;
    const name =
      key.type === 'Identifier'
        ? key.name
        : key.type === 'Literal' && (typeof key.value === 'string' || typeof key.value === 'number')
          ? String(key.value)
          : undefined;

    if (name === undefined || ['__proto__', 'constructor', 'prototype'].includes(name)) {
      return undefined;
    }
    keys.set(name, property);
  }

  return keys;
}

export const noStaleStructEvolveKeys: Rule = defineEffectRule(
  {
    type: 'problem',
    docs: {
      description: 'Disallow Struct.evolve updater keys absent from a direct closed target literal.',
      recommended: false,
      url: 'https://github.com/Effect-TS/tsgo/issues/488',
    },
    schema: [],
    messages: {
      staleKey: 'Updater key "{{key}}" is absent from this closed target literal and will be ignored by Struct.evolve.',
    },
  },
  (context, getState) => ({
    CallExpression(node) {
      if (node.optional) {
        return;
      }
      const state = getState();
      let targetExpression: ESTree.Expression | undefined;
      let updaterExpression: ESTree.Expression | undefined;

      if (node.arguments.length === 2 && isImportedApi(context, node.callee, state, ['Struct', 'evolve'])) {
        targetExpression = argumentAt(node, 0);
        updaterExpression = argumentAt(node, 1);
      } else if (
        node.arguments.length === 1 &&
        node.callee.type === 'CallExpression' &&
        !node.callee.optional &&
        node.callee.arguments.length === 1 &&
        isImportedApi(context, node.callee.callee, state, ['Struct', 'evolve'])
      ) {
        targetExpression = argumentAt(node, 0);
        updaterExpression = argumentAt(node.callee, 0);
      } else if (
        isImportedApi(context, node.callee, state, ['Function', 'pipe']) ||
        isImportedApi(context, node.callee, state, ['pipe'])
      ) {
        const firstStep = argumentAt(node, 1);

        if (
          firstStep?.type !== 'CallExpression' ||
          firstStep.optional ||
          firstStep.arguments.length !== 1 ||
          !isImportedApi(context, firstStep.callee, state, ['Struct', 'evolve'])
        ) {
          return;
        }
        targetExpression = argumentAt(node, 0);
        updaterExpression = argumentAt(firstStep, 0);
      } else {
        return;
      }
      const target = literalKeys(targetExpression);
      const updater = literalKeys(updaterExpression);

      if (target === undefined || updater === undefined) {
        return;
      }
      for (const [key, property] of updater) {
        if (!target.has(key)) {
          context.report({ node: property.key, messageId: 'staleKey', data: { key } });
        }
      }
    },
  }),
);
