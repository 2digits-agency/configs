import type { Context, ESTree, Rule, Variable } from '@oxlint/plugins';
import * as Arr from 'effect/Array';

import {
  canonicalPath,
  containsRange,
  defineEffectRule,
  resolveVariable,
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

const dynamicTypes = new Set<string>([
  'AssignmentExpression',
  'AwaitExpression',
  'ImportExpression',
  'TaggedTemplateExpression',
  'UpdateExpression',
  'YieldExpression',
]);

const transparentParentTypes = new Set<string>(['ParenthesizedExpression', 'TSAsExpression', 'TSNonNullExpression']);

// The callee root must resolve to the import itself, not to a parameter or local that shadows it.
function compilerMethod(node: ESTree.Node, state: FileState, context: Context): string | undefined {
  const path = canonicalPath(node, state);

  const method = path?.length === 2 && path[0] === 'Schema' ? path[1] : undefined;

  const root = staticPath(node)?.[0];

  if (method === undefined || root === undefined || !compilerMethods.has(method)) {
    return undefined;
  }

  const variable = resolveVariable(context, node, root);

  return variable !== undefined && Arr.every(variable.defs, (definition) => definition.type === 'ImportBinding')
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
  return Arr.every(
    variable.references,
    (reference) => (!reference.isWrite() || reference.init) && !isMutationTarget(reference.identifier),
  );
}

// Movable means declared at module scope with a stable value, or inside the schema itself (callback params).
function isMovableIdentifier(node: ESTree.Node, name: string, root: ESTree.Node, context: Context): boolean {
  const variable = resolveVariable(context, node, name);

  if (variable === undefined || containsRange(root, variable.scope.block)) {
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

function isInsideCallback(node: ESTree.Node, root: ESTree.Node): boolean {
  if (node === root) {
    return false;
  }

  let parent = node.parent as ESTree.Node | null;

  while (parent !== null && parent !== root) {
    if (functionTypes.has(parent.type)) {
      return true;
    }

    parent = parent.parent as ESTree.Node | null;
  }

  return false;
}

// Hoisting evaluates the arguments once, so only Effect API calls may run eagerly; callbacks still run later.
function isDynamic(node: ESTree.Node, root: ESTree.Node, state: FileState): boolean {
  if (isInsideCallback(node, root)) {
    return false;
  }

  if (node.type === 'CallExpression' || node.type === 'NewExpression') {
    return canonicalPath(node.callee, state) === undefined;
  }

  return dynamicTypes.has(node.type);
}

// Hoisting needs arguments free of `this`, `new.target`, function-local or mutable bindings, and non-Effect calls.
function isHoistable(node: ESTree.Node, state: FileState, context: Context): boolean {
  return !walkNodes(
    node,
    (child) =>
      child.type === 'ThisExpression' ||
      child.type === 'Super' ||
      (child.type === 'MetaProperty' && child.meta.name === 'new') ||
      isDynamic(child, node, state) ||
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
        Arr.some(node.arguments, (child) => child.type === 'SpreadElement') ||
        !isImmediatelyInvoked(node) ||
        !isInsideFunction(node)
      ) {
        return;
      }

      const schema = unwrapExpression(argument);

      const inlineSchema = isSchemaCall(schema, state);

      if (
        (!inlineSchema && schema.type !== 'Identifier' && schema.type !== 'MemberExpression') ||
        !Arr.every(node.arguments, (child) => isHoistable(child, state, context))
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
