import type { Context, ESTree, Rule, Scope, Variable } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import {
  argumentAt,
  canonicalPath,
  defineEffectRule,
  isFunctionNode,
  staticPath,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
  type FileState,
} from '../../utils';
import { functionResult } from './utils';

interface Finalizer {
  readonly kind: string;
  readonly values: ReadonlyArray<Variable | string>;
}

function binding(context: Context, node: ESTree.BindingIdentifier | ESTree.IdentifierReference): Variable | undefined {
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

function stable(variable: Variable): boolean {
  const definition = variable.defs[0];

  return (
    variable.defs.length === 1 &&
    (definition?.type !== 'ImportBinding' ||
      (definition.node.parent?.type === 'ImportDeclaration' &&
        definition.node.parent.importKind !== 'type' &&
        (definition.node.type !== 'ImportSpecifier' || definition.node.importKind !== 'type'))) &&
    variable.references.every((reference) => !reference.isWrite() || reference.init)
  );
}

function initializer(variable: Variable): ESTree.Expression | undefined {
  const definition = variable.defs[0];
  const node = definition?.node;

  return stable(variable) &&
    node?.type === 'VariableDeclarator' &&
    node.id.type === 'Identifier' &&
    definition?.parent?.type === 'VariableDeclaration' &&
    definition.parent.kind === 'const'
    ? (node.init ?? undefined)
    : undefined;
}

function runtimeImport(context: Context, node: ESTree.Node): Variable | undefined {
  let root = node;

  while (root.type === 'MemberExpression' && !root.optional) {
    root = root.object;
  }
  if (root.type !== 'Identifier' || !importedApi(context, node)) {
    return undefined;
  }
  const variable = binding(context, root);

  return variable !== undefined && stable(variable) ? variable : undefined;
}

function api(context: Context, node: ESTree.Node, state: FileState): string | undefined {
  const path = canonicalPath(node, state);
  const declaration = runtimeImport(context, node)?.defs[0]?.node.parent;

  if (path?.length !== 2 || declaration?.type !== 'ImportDeclaration') {
    return undefined;
  }
  const source = declaration.source.value;

  if (source !== 'effect' && source !== `effect/${path[0]}`) {
    return undefined;
  }

  return path.join('.');
}

function callbackResult(
  context: Context,
  node: ESTree.Expression | undefined,
  allowStatement = false,
  maxParameters = 1,
): ESTree.Expression | undefined {
  if (
    node === undefined ||
    !isFunctionNode(node) ||
    !node.body ||
    node.async ||
    node.generator ||
    node.params.length > maxParameters
  ) {
    return undefined;
  }

  for (const parameter of node.params) {
    if (parameter.type !== 'Identifier') {
      return undefined;
    }
    const variable = binding(context, parameter);

    if (variable === undefined || variable.references.length > 0) {
      return undefined;
    }
  }

  if (
    walkNodes(
      node.body,
      (child) => child.type === 'ThisExpression' || (child.type === 'Identifier' && child.name === 'arguments'),
    )
  ) {
    return undefined;
  }

  if (
    allowStatement &&
    node.body.type === 'BlockStatement' &&
    node.body.body.length === 1 &&
    node.body.body[0]?.type === 'ExpressionStatement'
  ) {
    return unwrapExpression(node.body.body[0].expression);
  }

  return functionResult(node);
}

function stableValue(context: Context, node: ESTree.Expression): ReadonlyArray<Variable | string> | undefined {
  const expression = unwrapExpression(node);

  if (expression.type === 'Literal' && !('regex' in expression)) {
    return [`${typeof expression.value}:${String(expression.value)}`];
  }
  if (expression.type === 'MemberExpression' && !expression.optional && importedApi(context, expression)) {
    const path = staticPath(expression);
    const variable = runtimeImport(context, expression);

    return path !== undefined && variable !== undefined ? [variable, `property:${path.slice(1).join('.')}`] : undefined;
  }
  if (expression.type !== 'Identifier') {
    return undefined;
  }
  const variable = binding(context, expression);

  return variable !== undefined && stable(variable) ? [variable] : undefined;
}

function assignmentTarget(node: ESTree.Node): ESTree.Node {
  let target = node;
  let parent = target.parent;

  while (
    parent &&
    ['ArrayPattern', 'ObjectPattern', 'Property', 'RestElement', 'AssignmentPattern'].includes(parent.type)
  ) {
    if (
      (parent.type === 'Property' && parent.value !== target) ||
      (parent.type === 'AssignmentPattern' && parent.left !== target)
    ) {
      break;
    }
    target = parent;
    parent = target.parent;
  }

  return target;
}

function writesClose(node: ESTree.Node): boolean {
  const member = node.parent;

  if (member?.type !== 'MemberExpression' || member.object !== node) {
    return false;
  }
  const property = staticPropertyName(member);
  const target = assignmentTarget(member);
  const operation = target.parent;

  return (
    (property === 'close' || property === undefined) &&
    ((operation?.type === 'AssignmentExpression' && operation.left === target) ||
      (operation?.type === 'UpdateExpression' && operation.argument === target) ||
      (operation?.type === 'UnaryExpression' && operation.operator === 'delete'))
  );
}

function handleAlias(
  context: Context,
  node: ESTree.BindingIdentifier | ESTree.IdentifierReference,
): Variable | undefined {
  const declaration = node.parent;

  if (declaration.type !== 'VariableDeclarator' || declaration.init !== node || declaration.id.type !== 'Identifier') {
    return undefined;
  }
  const variable = binding(context, declaration.id);

  return variable !== undefined && initializer(variable) !== undefined ? variable : undefined;
}

function closeUnmodified(context: Context, variable: Variable): boolean {
  const aliases = [variable];
  const seen = new Set<Variable>();

  while (aliases.length > 0) {
    const alias = aliases.pop();

    if (alias === undefined || seen.has(alias)) {
      continue;
    }
    seen.add(alias);

    for (const reference of alias.references) {
      if (writesClose(reference.identifier)) {
        return false;
      }
      const next = handleAlias(context, reference.identifier);

      if (next !== undefined) {
        aliases.push(next);
      }
    }
  }

  return true;
}

function sqliteHandle(context: Context, node: ESTree.IdentifierReference): Variable | undefined {
  const variable = binding(context, node);
  const init = variable === undefined ? undefined : initializer(variable);

  if (init?.type !== 'NewExpression') {
    return undefined;
  }
  const path = staticPath(init.callee);
  const specifier = runtimeImport(context, init.callee)?.defs[0]?.node;

  if (specifier?.parent?.type !== 'ImportDeclaration' || specifier.parent.source.value !== 'node:sqlite') {
    return undefined;
  }
  const namedDatabase =
    specifier.type === 'ImportSpecifier' &&
    specifier.imported.type === 'Identifier' &&
    specifier.imported.name === 'DatabaseSync' &&
    path?.length === 1;
  const namespaceDatabase =
    specifier.type === 'ImportNamespaceSpecifier' && path?.length === 2 && path[1] === 'DatabaseSync';

  return namedDatabase || namespaceDatabase ? variable : undefined;
}

function sqliteFinalizer(context: Context, node: ESTree.CallExpression): Finalizer | undefined {
  if (node.arguments.length !== 1) {
    return undefined;
  }
  const close = callbackResult(context, argumentAt(node, 0), true);

  if (
    close?.type !== 'CallExpression' ||
    close.optional ||
    close.arguments.length > 0 ||
    close.callee.type !== 'MemberExpression' ||
    close.callee.optional ||
    staticPropertyName(close.callee) !== 'close' ||
    close.callee.object.type !== 'Identifier'
  ) {
    return undefined;
  }
  const handle = sqliteHandle(context, close.callee.object);

  return handle === undefined || !closeUnmodified(context, handle)
    ? undefined
    : { kind: 'sqlite.close', values: [handle] };
}

function resolveAlias(context: Context, node: ESTree.Expression | undefined): ESTree.Expression | undefined {
  const seen = new Set<Variable>();
  let expression = node === undefined ? undefined : unwrapExpression(node);

  while (expression?.type === 'Identifier') {
    const variable = binding(context, expression);

    if (variable === undefined || seen.has(variable)) {
      return undefined;
    }
    seen.add(variable);
    const init = initializer(variable);

    expression = init === undefined ? undefined : unwrapExpression(init);
  }

  return expression;
}

function finalizer(context: Context, node: ESTree.Expression | undefined, state: FileState): Finalizer | undefined {
  const expression = resolveAlias(context, node);

  if (expression?.type !== 'CallExpression' || expression.optional) {
    return undefined;
  }
  const kind = api(context, expression.callee, state);

  if (kind === 'Effect.sync') {
    return sqliteFinalizer(context, expression);
  }
  const arity = kind === 'Deferred.interrupt' ? 1 : kind === 'Scope.close' ? 2 : undefined;

  if (kind === undefined || arity === undefined || expression.arguments.length !== arity) {
    return undefined;
  }
  const values: Array<Variable | string> = [];

  for (let index = 0; index < arity; index++) {
    const argument = argumentAt(expression, index);
    const value = argument === undefined ? undefined : stableValue(context, argument);

    if (value === undefined) {
      return undefined;
    }
    values.push(`argument:${index}`, ...value);
  }

  return { kind, values };
}

function sameFinalizer(left: Finalizer | undefined, right: Finalizer | undefined): boolean {
  return (
    left !== undefined &&
    right !== undefined &&
    left.kind === right.kind &&
    left.values.length === right.values.length &&
    left.values.every((value, index) => value === right.values[index])
  );
}

function owningRegion(node: ESTree.Node): ESTree.Node {
  let current = node;

  while (
    current.parent &&
    !['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration'].includes(current.type)
  ) {
    current = current.parent;
  }

  return current;
}

function cleanupTap(
  context: Context,
  node: ESTree.Expression | undefined,
  state: FileState,
): { node: ESTree.CallExpression; cleanup: Finalizer; success: boolean } | undefined {
  if (node?.type !== 'CallExpression' || node.optional || node.arguments.length !== 1) {
    return undefined;
  }
  const name = api(context, node.callee, state);

  if (name !== 'Effect.tap' && name !== 'Effect.tapError' && name !== 'Effect.tapCause') {
    return undefined;
  }
  const cleanup = finalizer(context, callbackResult(context, argumentAt(node, 0)), state);

  return cleanup === undefined ? undefined : { node, cleanup, success: name === 'Effect.tap' };
}

function protectedGenerator(context: Context, node: ESTree.CallExpression, state: FileState): ESTree.Node | undefined {
  let target: ESTree.Expression | undefined = node.arguments.length === 2 ? argumentAt(node, 0) : undefined;
  const parent = node.parent;

  if (
    target === undefined &&
    parent.type === 'CallExpression' &&
    parent.callee.type === 'MemberExpression' &&
    staticPropertyName(parent.callee) === 'pipe'
  ) {
    target = parent.callee.object;
  }
  while (
    target?.type === 'CallExpression' &&
    target.callee.type === 'MemberExpression' &&
    staticPropertyName(target.callee) === 'pipe'
  ) {
    target = target.callee.object;
  }
  if (target?.type !== 'CallExpression' || api(context, target.callee, state) !== 'Effect.gen') {
    return undefined;
  }
  const generator = argumentAt(target, 0);

  return generator !== undefined && isFunctionNode(generator) ? generator : undefined;
}

function registeredFinalizer(
  context: Context,
  node: ESTree.CallExpression,
  name: string | undefined,
  state: FileState,
): Finalizer | undefined {
  const argument = argumentAt(node, node.arguments.length - 1);

  if (name === 'Effect.ensuring') {
    return finalizer(context, argument, state);
  }
  if (
    !['Effect.onExit', 'Effect.addFinalizer', 'Effect.acquireRelease', 'Effect.acquireUseRelease'].includes(name ?? '')
  ) {
    return undefined;
  }
  const maxParameters = ['Effect.acquireRelease', 'Effect.acquireUseRelease'].includes(name ?? '') ? 2 : 1;

  return finalizer(context, callbackResult(context, argument, false, maxParameters), state);
}

export const noInterruptionUnsafeCleanupTaps: Rule = defineEffectRule(
  {
    type: 'problem',
    docs: {
      description: 'Detect interruption-unsafe duplicated resource cleanup taps.',
      recommended: false,
      url: 'https://github.com/2digits-agency/configs/issues/2718',
    },
    schema: [],
    messages: {
      cleanup:
        'The same resource cleanup is attached to terminal outcome taps and is not guaranteed on interruption. Verify ownership and existing finalizers, then replace the pair with ensuring or an acquire/release API if all-exit cleanup is required. Preserve lazy construction; do not add a second finalizer or make finalization interruptible.',
    },
  },
  (context, getState) => {
    const candidates: Array<{ node: ESTree.CallExpression; cleanup: Finalizer; region: ESTree.Node }> = [];
    const registrations = new Map<ESTree.Node, Array<Finalizer>>();

    return {
      before() {
        candidates.length = 0;
        registrations.clear();
      },
      CallExpression(node) {
        const state = getState();
        const name = api(context, node.callee, state);
        const region = owningRegion(node);
        const registered = registeredFinalizer(context, node, name, state);

        if (registered !== undefined) {
          const protectedRegion =
            name === 'Effect.ensuring' || name === 'Effect.onExit'
              ? protectedGenerator(context, node, state)
              : undefined;
          const owners = protectedRegion === undefined ? [region] : [region, protectedRegion];

          for (const owner of owners) {
            const existing = registrations.get(owner) ?? [];

            existing.push(registered);
            registrations.set(owner, existing);
          }
        }
        if (
          node.callee.type !== 'MemberExpression' ||
          staticPropertyName(node.callee) !== 'pipe' ||
          node.optional ||
          node.callee.optional
        ) {
          return;
        }

        for (let index = 0; index < node.arguments.length - 1; index++) {
          const left = cleanupTap(context, argumentAt(node, index), state);
          const right = cleanupTap(context, argumentAt(node, index + 1), state);

          if (
            left !== undefined &&
            right !== undefined &&
            left.success !== right.success &&
            sameFinalizer(left.cleanup, right.cleanup)
          ) {
            candidates.push({ node: left.node, cleanup: left.cleanup, region });
          }
        }
      },
      'Program:exit': function reportCleanupPairs() {
        for (const candidate of candidates) {
          if (
            !registrations.get(candidate.region)?.some((registered) => sameFinalizer(candidate.cleanup, registered))
          ) {
            context.report({ node: candidate.node, messageId: 'cleanup' });
          }
        }
      },
    };
  },
);
