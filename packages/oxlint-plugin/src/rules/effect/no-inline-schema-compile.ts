import type { Context, ESTree, Rule, Scope } from '@oxlint/plugins';

import { canonicalPath, defineEffectRule, ruleMeta, unwrapExpression, walkNodes, type FileState } from '../../utils';

const compilerMethods = new Set([
  'asserts',
  'decodeEffect',
  'decodeExit',
  'decodeOption',
  'decodePromise',
  'decodeResult',
  'decodeSync',
  'decodeUnknownEffect',
  'decodeUnknownExit',
  'decodeUnknownOption',
  'decodeUnknownPromise',
  'decodeUnknownResult',
  'decodeUnknownSync',
  'encodeEffect',
  'encodeExit',
  'encodeOption',
  'encodePromise',
  'encodeResult',
  'encodeSync',
  'encodeUnknownEffect',
  'encodeUnknownExit',
  'encodeUnknownOption',
  'encodeUnknownPromise',
  'encodeUnknownResult',
  'encodeUnknownSync',
  'is',
]);

const moduleScopes = new Set<string>(['global', 'module']);

const functionTypes = new Set<string>(['ArrowFunctionExpression', 'FunctionDeclaration', 'FunctionExpression']);

const transparentParentTypes = new Set<string>(['ParenthesizedExpression', 'TSAsExpression', 'TSNonNullExpression']);

function compilerMethod(node: ESTree.Node, state: FileState): string | undefined {
  const path = canonicalPath(node, state);

  return path?.length === 2 && path[0] === 'Schema' && compilerMethods.has(path[1] ?? '') ? path[1] : undefined;
}

function isInsideFunction(node: ESTree.Node): boolean {
  let parent = node.parent;

  while (parent) {
    if (functionTypes.has(parent.type)) {
      return true;
    }

    parent = parent.parent;
  }

  return false;
}

function isImmediatelyInvoked(node: ESTree.CallExpression): boolean {
  let current: ESTree.Node = node;

  let parent = node.parent;

  while (transparentParentTypes.has(parent.type) && parent.parent !== null) {
    current = parent;

    parent = parent.parent;
  }

  return parent.type === 'CallExpression' && parent.callee === current;
}

function isSchemaCall(node: ESTree.Expression, state: FileState): boolean {
  return node.type === 'CallExpression' && canonicalPath(node.callee, state)?.[0] === 'Schema';
}

function contains(outer: ESTree.Node, inner: ESTree.Node): boolean {
  return outer.range[0] <= inner.range[0] && inner.range[1] <= outer.range[1];
}

// Local means declared in an enclosing function, not at module scope or inside the schema itself (callback params).
function isLocalIdentifier(node: ESTree.Node, name: string, root: ESTree.Node, context: Context): boolean {
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope !== null) {
    if (scope.set.has(name)) {
      return !moduleScopes.has(scope.type) && !contains(root, scope.block);
    }

    scope = scope.upper;
  }

  return false;
}

function isNonReferenceName(node: ESTree.Node): boolean {
  const parent = node.parent as ESTree.Node | null;

  return (
    (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
    (parent?.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand)
  );
}

// A schema can only be hoisted when it does not depend on `this` or on bindings declared inside a function.
function isHoistable(node: ESTree.Expression, context: Context): boolean {
  return !walkNodes(
    node,
    (child) =>
      child.type === 'ThisExpression' ||
      child.type === 'Super' ||
      (child.type === 'Identifier' &&
        !isNonReferenceName(child) &&
        isLocalIdentifier(child, child.name, node, context)),
  );
}

export const noInlineSchemaCompile: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow compiling Schema decoders, encoders, and guards inside function bodies.',
    {
      inlineSchema:
        'Hoist Schema.{{method}}(...) to module scope: both the inline schema and the compiled function are rebuilt on every call. Move the compiled function to a module-level const.',
      inlineCompile:
        'Hoist Schema.{{method}}(...) to module scope: the compiled function is rebuilt on every call. Move it to a module-level const.',
    },
    'https://github.com/pingdotgg/t3code/blob/main/oxlint-plugin-t3code/rules/no-inline-schema-compile.ts',
  ),
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();

      if (!state.hasEffectImport) {
        return;
      }

      const method = compilerMethod(node.callee, state);

      const [argument] = node.arguments;

      if (
        method === undefined ||
        argument === undefined ||
        argument.type === 'SpreadElement' ||
        !isImmediatelyInvoked(node) ||
        !isInsideFunction(node)
      ) {
        return;
      }

      const schema = unwrapExpression(argument);

      const inlineSchema = isSchemaCall(schema, state);

      if (
        (!inlineSchema && schema.type !== 'Identifier' && schema.type !== 'MemberExpression') ||
        !isHoistable(schema, context)
      ) {
        return;
      }

      context.report({
        node: node.callee,
        messageId: inlineSchema ? 'inlineSchema' : 'inlineCompile',
        data: { method },
      });
    },
  }),
);
