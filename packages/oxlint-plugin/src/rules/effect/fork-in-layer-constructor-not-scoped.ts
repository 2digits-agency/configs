import type { Context, ESTree, Rule, Scope } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import {
  argumentAt,
  callbackCall,
  defineEffectRule,
  enclosingFunction,
  isApi,
  isFunctionNode,
  objectProperty,
  ruleMeta,
  staticPropertyName,
  unwrapExpression,
  type FileState,
} from '../../utils';

function api(node: ESTree.Node, context: Context, state: FileState, namespace: string, member: string): boolean {
  return isApi(node, state, namespace, member) && importedApi(context, node);
}

function childFork(node: ESTree.Node, context: Context, state: FileState, methods: ReadonlyArray<string>): boolean {
  return methods.some((method) => api(node, context, state, 'Effect', method));
}

function constInitializer(node: ESTree.Expression, context: Context): ESTree.Expression | undefined {
  if (node.type !== 'Identifier') {
    return undefined;
  }
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope !== null) {
    const variable = scope.set.get(node.name);

    if (variable) {
      const declaration = variable.defs.length === 1 ? variable.defs[0]?.node : undefined;

      return declaration?.type === 'VariableDeclarator' &&
        declaration.parent.type === 'VariableDeclaration' &&
        declaration.parent.kind === 'const' &&
        declaration.id.type === 'Identifier' &&
        declaration.init &&
        declaration.init.range[1] <= node.range[0]
        ? unwrapExpression(declaration.init)
        : undefined;
    }
    scope = scope.upper;
  }

  return undefined;
}

function effectReceiver(node: ESTree.Expression, context: Context, state: FileState): boolean {
  let expression = unwrapExpression(node);

  while (expression.type === 'Identifier' && !importedApi(context, expression)) {
    const initializer = constInitializer(expression, context);

    if (!initializer) {
      return false;
    }
    expression = initializer;
  }
  if (api(expression, context, state, 'Effect', 'never') || api(expression, context, state, 'Effect', 'void')) {
    return true;
  }

  // A custom or unknown .pipe method may discard the fork operation entirely.
  return (
    expression.type === 'CallExpression' &&
    ['gen', 'forever', 'sync', 'succeed', 'fail', 'sleep'].some((method) =>
      api(expression.callee, context, state, 'Effect', method),
    )
  );
}

function executedFork(
  node: ESTree.Expression,
  context: Context,
  state: FileState,
  methods: ReadonlyArray<string>,
): ESTree.Node | undefined {
  if (node.type !== 'CallExpression') {
    return undefined;
  }
  const effect = argumentAt(node, 0);

  if (!effect) {
    return undefined;
  }
  const resolvedEffect = constInitializer(effect, context) ?? effect;

  if (resolvedEffect.type !== 'ObjectExpression' && childFork(node.callee, context, state, methods)) {
    return node;
  }
  if (
    node.callee.type !== 'MemberExpression' ||
    staticPropertyName(node.callee) !== 'pipe' ||
    !effectReceiver(node.callee.object, context, state)
  ) {
    return undefined;
  }
  const fork = effect;

  if (node.arguments.length !== 1) {
    return undefined;
  }
  if (childFork(fork, context, state, methods)) {
    return fork;
  }
  if (
    fork.type === 'CallExpression' &&
    api(fork.callee, context, state, 'Effect', 'forkChild') &&
    methods.includes('forkChild')
  ) {
    const options = argumentAt(fork, 0);
    const resolvedOptions = options ? (constInitializer(options, context) ?? options) : undefined;

    return fork.arguments.length === 0 || (fork.arguments.length === 1 && resolvedOptions?.type === 'ObjectExpression')
      ? fork
      : undefined;
  }

  return undefined;
}

function unjoinedBinding(
  declaration: ESTree.VariableDeclarator,
  body: ESTree.BlockStatement,
  context: Context,
  state: FileState,
): boolean {
  const variable = context.sourceCode.getDeclaredVariables(declaration)[0];

  if (!variable) {
    return false;
  }

  return variable.references.every((reference) => {
    if (reference.init && !reference.isRead()) {
      return true;
    }
    const identifier = reference.identifier;
    const parent = identifier.parent;

    if (parent.type === 'CallExpression' && api(parent.callee, context, state, 'Fiber', 'interrupt')) {
      const callback = enclosingFunction(parent);
      const finalizer = callback ? callbackCall(callback) : undefined;

      // A later interrupt hook cannot prevent the construction fiber from stopping its child early.
      return finalizer !== undefined && api(finalizer.callee, context, state, 'Effect', 'addFinalizer');
    }
    if (parent.type === 'CallExpression' && api(parent.callee, context, state, 'Fiber', 'join')) {
      // An unexecuted join expression does not wait for the child. All other uses, including
      // Executed joins and unknown ownership transfers, are excluded conservatively.
      return parent.parent.type === 'ExpressionStatement' && body.body.includes(parent.parent);
    }

    return false;
  });
}

function unjoinedStatementFork(
  statement: ESTree.Statement,
  body: ESTree.BlockStatement,
  context: Context,
  state: FileState,
  methods: ReadonlyArray<string>,
): ESTree.Node | undefined {
  let expression: ESTree.Expression | undefined;
  let declaration: ESTree.VariableDeclarator | undefined;

  if (statement.type === 'ExpressionStatement') {
    expression = statement.expression;
  } else if (statement.type === 'VariableDeclaration' && statement.kind === 'const') {
    declaration = statement.declarations.length === 1 ? statement.declarations[0] : undefined;
    if (declaration?.id.type === 'Identifier') {
      expression = declaration.init ?? undefined;
    }
  }
  const yielded = expression?.type === 'YieldExpression' ? expression : undefined;
  const fork =
    yielded?.delegate && yielded.argument ? executedFork(yielded.argument, context, state, methods) : undefined;

  return fork && (!declaration || unjoinedBinding(declaration, body, context, state)) ? fork : undefined;
}

const meta = ruleMeta(
  'problem',
  'Bind construction-time child fibers to the service scope.',
  {
    constructorFork:
      'This construction-time child fork belongs to the layer-building fiber, not the service scope. Use Effect.forkScoped for startup work (and Layer.scoped in Effect v3).',
  },
  'https://github.com/Effect-TS/tsgo/issues/486',
);

export const forkInLayerConstructorNotScoped: Rule = defineEffectRule(
  {
    ...meta,
    docs: { ...meta.docs, recommended: false },
  },
  (context, getState) => ({
    CallExpression(node) {
      const state = getState();
      let make: ESTree.Expression | undefined;
      let methods = ['forkChild', 'fork'];

      if (api(node.callee, context, state, 'Layer', 'effect')) {
        make = argumentAt(node, 1);
      } else if (api(node.callee, context, state, 'Layer', 'scoped')) {
        make = argumentAt(node, 1);
        methods = ['fork'];
      } else if (
        node.callee.type === 'CallExpression' &&
        api(node.callee.callee, context, state, 'Context', 'Service')
      ) {
        methods = ['forkChild'];
        const options = argumentAt(node, 1);

        if (options?.type === 'ObjectExpression') {
          make = objectProperty(options, 'make')?.value;
        }
      } else {
        return;
      }

      if (make?.type !== 'CallExpression' || !api(make.callee, context, state, 'Effect', 'gen')) {
        return;
      }
      const generator = make.arguments.find((element) => isFunctionNode(element));

      if (!generator || !generator.generator || generator.body?.type !== 'BlockStatement') {
        return;
      }
      for (const statement of generator.body.body) {
        if (statement.type === 'ReturnStatement' || statement.type === 'ThrowStatement') {
          break;
        }
        const fork = unjoinedStatementFork(statement, generator.body, context, state, methods);

        if (fork) {
          context.report({ node: fork, messageId: 'constructorFork' });
        }
      }
    },
  }),
);
