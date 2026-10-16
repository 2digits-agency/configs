import type { Context, ESTree, Rule, Scope, Variable } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Fn from 'effect/Function';

import {
  canonicalPath,
  defineEffectRule,
  ruleMeta,
  staticPath,
  unwrapExpression,
  walkNodes,
  type FileState,
} from '../../utils';

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

function resolveVariable(node: ESTree.Node, name: string, context: Context): Variable | undefined {
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope !== null) {
    const variable = scope.set.get(name);

    if (variable !== undefined) {
      return variable;
    }

    scope = scope.upper;
  }

  return undefined;
}

// The callee root must resolve to the import itself, not to a parameter or local that shadows it.
function compilerMethod(node: ESTree.Node, state: FileState, context: Context): string | undefined {
  const path = canonicalPath(node, state);

  const method = path?.length === 2 && path[0] === 'Schema' ? path[1] : undefined;

  const root = staticPath(node)?.[0];

  if (method === undefined || root === undefined || !compilerMethods.has(method)) {
    return undefined;
  }

  const variable = resolveVariable(node, root, context);

  return variable !== undefined &&
    Fn.pipe(
      variable.defs,
      Arr.every((definition) => definition.type === 'ImportBinding'),
    )
    ? method
    : undefined;
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

function isMutationTarget(node: ESTree.Node): boolean {
  let current = node;

  let parent = node.parent as ESTree.Node | null;

  while (parent?.type === 'MemberExpression' && parent.object === current) {
    current = parent;

    parent = parent.parent as ESTree.Node | null;
  }

  return (
    current !== node &&
    ((parent?.type === 'AssignmentExpression' && parent.left === current) ||
      (parent?.type === 'UpdateExpression' && parent.argument === current) ||
      (parent?.type === 'UnaryExpression' && parent.operator === 'delete' && parent.argument === current))
  );
}

// A module binding is stable when neither it nor its members are reassigned after initialization.
function isStableVariable(variable: Variable): boolean {
  return Fn.pipe(
    variable.references,
    Arr.every((reference) => (!reference.isWrite() || reference.init) && !isMutationTarget(reference.identifier)),
  );
}

// Movable means declared at module scope with a stable value, or inside the schema itself (callback params).
function isMovableIdentifier(node: ESTree.Node, name: string, root: ESTree.Node, context: Context): boolean {
  const variable = resolveVariable(node, name, context);

  if (variable === undefined || contains(root, variable.scope.block)) {
    return true;
  }

  return moduleScopes.has(variable.scope.type) && isStableVariable(variable);
}

function isNonReferenceName(node: ESTree.Node): boolean {
  const parent = node.parent as ESTree.Node | null;

  return (
    (parent?.type === 'MemberExpression' && parent.property === node && !parent.computed) ||
    (parent?.type === 'Property' && parent.key === node && !parent.computed && !parent.shorthand)
  );
}

// Hoisting needs arguments free of `this`, function-local bindings, and mutable module bindings.
function isHoistable(node: ESTree.Node, context: Context): boolean {
  return !walkNodes(
    node,
    (child) =>
      child.type === 'ThisExpression' ||
      child.type === 'Super' ||
      (child.type === 'Identifier' &&
        !isNonReferenceName(child) &&
        !isMovableIdentifier(child, child.name, node, context)),
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

      const method = compilerMethod(node.callee, state, context);

      const [argument] = node.arguments;

      if (
        method === undefined ||
        argument === undefined ||
        argument.type === 'SpreadElement' ||
        Fn.pipe(
          node.arguments,
          Arr.some((child) => child.type === 'SpreadElement'),
        ) ||
        !isImmediatelyInvoked(node) ||
        !isInsideFunction(node)
      ) {
        return;
      }

      const schema = unwrapExpression(argument);

      const inlineSchema = isSchemaCall(schema, state);

      if (
        (!inlineSchema && schema.type !== 'Identifier' && schema.type !== 'MemberExpression') ||
        !Fn.pipe(
          node.arguments,
          Arr.every((child) => isHoistable(child, context)),
        )
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
