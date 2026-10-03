import type { Context, ESTree, Rule, Scope, Variable } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import {
  argumentAt,
  canonicalPath,
  defineEffectRule,
  isApi,
  isFunctionNode,
  isGlobalIdentifier,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
  type FileState,
  type FunctionNode,
} from '../../utils';

const arrayMutators = new Set(['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']);
const effectConstructors = new Set([
  'succeed',
  'fail',
  'failCause',
  'die',
  'sync',
  'suspend',
  'gen',
  'try',
  'promise',
  'tryPromise',
  'callback',
  'fromNullable',
  'fromOption',
  'fromResult',
  'sleep',
  'yieldNow',
  'all',
]);
const effectCombinators = new Set([
  'map',
  'flatMap',
  'forEach',
  'andThen',
  'tap',
  'as',
  'catch',
  'catchTag',
  'catchCause',
  'retry',
  'repeat',
  'ensuring',
  'onExit',
  'provide',
  'provideService',
  'withSpan',
  'timeout',
]);

interface Frame {
  readonly node: FunctionNode;
  readonly deferred: boolean;
  readonly mutations: Array<ESTree.Node>;
  readonly returns: Array<ESTree.Node>;
}

function binding(context: Context, node: ESTree.Node, name: string): Variable | undefined {
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

function effectResult(node: ESTree.Expression, context: Context, state: FileState): boolean {
  const expression = unwrapExpression(node);

  if (expression.type === 'ConditionalExpression') {
    return effectResult(expression.consequent, context, state) && effectResult(expression.alternate, context, state);
  }
  if (expression.type === 'SequenceExpression') {
    const last = expression.expressions.at(-1);

    return last !== undefined && effectResult(last, context, state);
  }
  if (expression.type === 'CallExpression') {
    const callee = expression.callee;

    if (callee.type === 'MemberExpression' && staticPropertyName(callee) === 'pipe') {
      return (
        effectResult(callee.object, context, state) &&
        expression.arguments.every((argument) => {
          const api = argument.type === 'CallExpression' ? argument.callee : argument;
          const path = canonicalPath(api, state);

          return (
            importedApi(context, api) &&
            path?.length === 2 &&
            path[0] === 'Effect' &&
            (path[1] === 'asVoid' || (argument.type === 'CallExpression' && effectCombinators.has(path[1] ?? '')))
          );
        })
      );
    }
    const path = canonicalPath(callee, state);

    return (
      importedApi(context, callee) &&
      path?.length === 2 &&
      path[0] === 'Effect' &&
      (effectConstructors.has(path[1] ?? '') ||
        path[1] === 'asVoid' ||
        (effectCombinators.has(path[1] ?? '') && dataFirstCombinator(expression, path[1] ?? '')))
    );
  }

  return (
    importedApi(context, expression) && ['void', 'never'].some((member) => isApi(expression, state, 'Effect', member))
  );
}

function dataFirstCombinator(call: ESTree.CallExpression, member: string): boolean {
  const first = argumentAt(call, 0);

  if (member === 'catchTag') {
    return call.arguments.length >= 3 && first?.type !== 'Literal' && first?.type !== 'ArrayExpression';
  }

  return call.arguments.length >= 2 && !isFunctionNode(first);
}

function effectAnnotation(node: FunctionNode, context: Context, state: FileState): boolean {
  const annotation = node.returnType?.typeAnnotation;

  if (annotation?.type !== 'TSTypeReference') {
    return false;
  }
  const parts: Array<string> = [];
  let name = annotation.typeName;

  while (name.type === 'TSQualifiedName') {
    parts.unshift(name.right.name);
    name = name.left;
  }
  if (name.type !== 'Identifier') {
    return false;
  }
  const imported = state.bindings.get(name.name);
  const variable = binding(context, name, name.name);

  return (
    variable?.defs.some((definition) => definition.type === 'ImportBinding') === true &&
    [...(imported ?? []), ...parts].join('.') === 'Effect.Effect'
  );
}

function deferredBody(node: FunctionNode, context: Context, state: FileState): boolean {
  const call = node.parent;

  if (call.type !== 'CallExpression') {
    return false;
  }
  let api = call.callee;
  const curried = api.type === 'CallExpression';

  if (api.type === 'CallExpression') {
    api = api.callee;
  }
  if (!importedApi(context, api)) {
    return false;
  }
  const path = canonicalPath(api, state)?.join('.');

  if (path === 'Effect.fn') {
    if (call.callee.type === 'CallExpression') {
      const name = argumentAt(call.callee, 0);

      if (name?.type !== 'Literal' || typeof name.value !== 'string') {
        return false;
      }
    }

    const first = argumentAt(call, 0);
    const options = first?.type === 'Identifier' ? binding(context, first, first.name) : undefined;
    const hasOptions =
      first?.type === 'ObjectExpression' ||
      (options !== undefined &&
        options.references.every((reference) => !reference.isWrite() || reference.init) &&
        options.defs.some(
          (definition) =>
            definition.node.type === 'VariableDeclarator' &&
            definition.node.init !== null &&
            unwrapExpression(definition.node.init).type === 'ObjectExpression',
        ));

    return argumentAt(call, hasOptions ? 1 : 0) === node;
  }
  if (curried) {
    return false;
  }

  return deferredPosition(call, path ?? '', node);
}

function deferredPosition(call: ESTree.CallExpression, path: string, node: FunctionNode): boolean {
  const first = argumentAt(call, 0);

  // These callback slots are evaluated by the Effect 4 runtime, not by construction.
  if (
    [
      'Effect.flatMap',
      'Effect.andThen',
      'Effect.tap',
      'Effect.catch',
      'Effect.catchCause',
      'Effect.onExit',
      'Effect.forEach',
      'Stream.runForEach',
    ].includes(path)
  ) {
    return argumentAt(call, isFunctionNode(first) ? 0 : 1) === node;
  }
  if (path === 'Effect.catchTag') {
    const callbackIndex = first?.type === 'Literal' || first?.type === 'ArrayExpression' ? 1 : 2;

    return argumentAt(call, callbackIndex) === node || argumentAt(call, callbackIndex + 1) === node;
  }

  return (
    (path === 'Effect.gen' && argumentAt(call, first?.type === 'ObjectExpression' ? 1 : 0) === node) ||
    (['Effect.sync', 'Effect.suspend', 'Effect.withFiber', 'HttpClient.make'].includes(path) && first === node)
  );
}

function rootIdentifier(node: ESTree.Node): ESTree.IdentifierReference | ESTree.BindingIdentifier | undefined {
  let current = node;

  while (current.type === 'MemberExpression') {
    current = current.object;
  }

  return current.type === 'Identifier' ? current : undefined;
}

function externalTarget(
  node: ESTree.Node,
  frame: Frame,
  context: Context,
  mutatesObject = node.type === 'MemberExpression',
): Variable | undefined {
  const root = rootIdentifier(node);
  const variable = root === undefined ? undefined : binding(context, root, root.name);

  if (
    variable === undefined ||
    variable.defs.every((definition) => !['Variable', 'Parameter'].includes(definition.type))
  ) {
    return undefined;
  }
  if (
    variable.scope.variableScope.block !== frame.node ||
    (mutatesObject && variable.defs.some((definition) => definition.type === 'Parameter'))
  ) {
    const writes = variable.references.filter(
      (reference) =>
        reference.isWrite() &&
        !reference.init &&
        reference.identifier.range[0] < node.range[0] &&
        reference.from.variableScope.block === frame.node,
    );
    const latest = writes.at(-1)?.identifier.parent;

    if (
      mutatesObject &&
      latest?.type === 'AssignmentExpression' &&
      latest.parent.type === 'ExpressionStatement' &&
      latest.parent.parent === frame.node.body &&
      ['ArrayExpression', 'ObjectExpression'].includes(unwrapExpression(latest.right).type)
    ) {
      return undefined;
    }

    return variable;
  }

  return undefined;
}

function nativeReceiver(variable: Variable, kind: 'array' | 'object', context: Context): boolean {
  if (variable.references.some((reference) => reference.isWrite() && !reference.init)) {
    return false;
  }

  return variable.defs.some((definition) => {
    const id = definition.name;
    const annotation = id.typeAnnotation?.typeAnnotation;
    const initializer =
      definition.node.type === 'VariableDeclarator' && definition.node.init
        ? unwrapExpression(definition.node.init)
        : undefined;

    if (kind === 'array' && (initializer?.type === 'ArrayExpression' || annotation?.type === 'TSArrayType')) {
      return true;
    }
    if (kind === 'object' && (initializer?.type === 'ObjectExpression' || annotation?.type === 'TSTypeLiteral')) {
      return true;
    }
    if (annotation?.type !== 'TSTypeReference' || annotation.typeName.type !== 'Identifier') {
      return false;
    }

    return isGlobalIdentifier(annotation.typeName, context, kind === 'array' ? 'Array' : 'Record');
  });
}

export const noEagerEffectMutation: Rule = defineEffectRule(
  {
    ...ruleMeta(
      'problem',
      'Detect external mutation during Effect construction.',
      {
        eagerMutation:
          'This mutation happens when the function is called, not when its returned Effect runs. If mutation is intended per execution, use Effect.suspend or Effect.fn (v4). Suppress this rule for deliberate construction instrumentation.',
      },
      'https://github.com/2digits-agency/configs/issues/2724',
    ),
    docs: {
      description: 'Detect external mutation during Effect construction.',
      recommended: false,
      url: 'https://github.com/2digits-agency/configs/issues/2724',
    },
  },
  (context, getState) => {
    let frames: Array<Frame> = [];

    function enter(node: FunctionNode): void {
      const returns =
        node.body && node.body.type !== 'BlockStatement' && effectResult(node.body, context, getState())
          ? [node.body]
          : [];

      frames.push({
        node,
        deferred:
          node.async ||
          node.generator ||
          node.parent.type === 'MethodDefinition' ||
          deferredBody(node, context, getState()),
        mutations: [],
        returns,
      });
    }

    function exit(): void {
      const frame = frames.pop();

      if (!frame || frame.deferred) {
        return;
      }
      const annotated = effectAnnotation(frame.node, context, getState());
      const mutation = frame.mutations.find(
        (candidate) => annotated || frame.returns.some((returned) => candidate.range[0] < returned.range[1]),
      );

      if (mutation) {
        context.report({ node: mutation, messageId: 'eagerMutation' });
      }
    }

    function assignment(node: ESTree.AssignmentExpression | ESTree.UpdateExpression): void {
      const frame = frames.at(-1);
      const target = node.type === 'AssignmentExpression' ? node.left : node.argument;

      if (frame && externalTarget(target, frame, context)) {
        frame.mutations.push(node);
      }
    }

    return {
      before() {
        frames = [];
      },
      FunctionDeclaration: enter,
      'FunctionDeclaration:exit': exit,
      FunctionExpression: enter,
      'FunctionExpression:exit': exit,
      ArrowFunctionExpression: enter,
      'ArrowFunctionExpression:exit': exit,
      ReturnStatement(node) {
        const frame = frames.at(-1);

        if (frame && node.argument && effectResult(node.argument, context, getState())) {
          frame.returns.push(node);
        }
      },
      AssignmentExpression: assignment,
      UpdateExpression: assignment,
      CallExpression(node) {
        const frame = frames.at(-1);
        const callee = node.callee;

        if (!frame || callee.type !== 'MemberExpression') {
          return;
        }
        const method = staticPropertyName(callee);
        const objectMutation = method === 'assign' && isGlobalIdentifier(callee.object, context, 'Object');
        const receiver = objectMutation ? argumentAt(node, 0) : callee.object;

        if (receiver?.type !== 'Identifier' || (!objectMutation && !arrayMutators.has(method ?? ''))) {
          return;
        }
        const target = objectMutation ? receiver : callee;
        const variable = externalTarget(target, frame, context, true);

        if (variable && nativeReceiver(variable, objectMutation ? 'object' : 'array', context)) {
          frame.mutations.push(node);
        }
      },
    };
  },
);
