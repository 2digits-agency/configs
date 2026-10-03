import type { Context, ESTree, Rule, Scope } from '@oxlint/plugins';

import { defineSyntaxRule, enclosingFunction, staticPath } from '../../utils';

const modules = new Map<string, ReadonlyArray<string>>([
  ['effect', []],
  ['effect/Effect', ['Effect']],
  ['effect/testing', []],
  ['effect/TestClock', ['TestClock']],
  ['effect/testing/TestClock', ['TestClock']],
  ['@effect/vitest', ['Vitest']],
  ['vitest', ['NativeVitest']],
]);

function runtimeImport(
  node: ESTree.Node,
  context: Context,
  name: string,
): ESTree.ImportSpecifier | ESTree.ImportNamespaceSpecifier | undefined {
  let scope: Scope | null = context.sourceCode.getScope(node);

  while (scope !== null) {
    const variable = scope.set.get(name);

    if (variable) {
      const definition = variable.defs[0];

      if (definition?.type !== 'ImportBinding') {
        return undefined;
      }
      const specifier = definition.node;
      const declaration = specifier.parent;

      if (
        declaration?.type !== 'ImportDeclaration' ||
        declaration.importKind === 'type' ||
        (specifier.type !== 'ImportSpecifier' && specifier.type !== 'ImportNamespaceSpecifier') ||
        (specifier.type === 'ImportSpecifier' && specifier.importKind === 'type')
      ) {
        return undefined;
      }

      return specifier;
    }
    scope = scope.upper;
  }

  return undefined;
}

function apiPath(node: ESTree.Node, context: Context): string | undefined {
  const path = staticPath(node);
  const root = path?.[0];
  const specifier = root === undefined ? undefined : runtimeImport(node, context, root);
  const declaration = specifier?.parent;

  if (!path || !specifier || declaration?.type !== 'ImportDeclaration') {
    return undefined;
  }
  const prefix = modules.get(declaration.source.value);

  if (!prefix) {
    return undefined;
  }
  const imported =
    specifier.type === 'ImportSpecifier'
      ? [specifier.imported.type === 'Identifier' ? specifier.imported.name : specifier.imported.value]
      : [];

  return [...prefix, ...imported, ...path.slice(1)].join('.');
}

function positiveDuration(node: ESTree.Node | undefined): boolean {
  if (node?.type !== 'Literal') {
    return false;
  }
  if (typeof node.value === 'number') {
    // Effect rounds fractional milliseconds to nanoseconds, with ties away from zero.
    return Number.isFinite(node.value) && node.value >= 0.0000005;
  }
  if (typeof node.value !== 'string') {
    return false;
  }
  const match = /^(\d+(?:\.\d+)?)\s+(nanos?|micros?|millis?|seconds?|minutes?|hours?|days?|weeks?)$/.exec(node.value);
  const millisPerUnit: Readonly<Record<string, number>> = {
    nano: 0.000001,
    micro: 0.001,
    milli: 1,
    second: 1000,
    minute: 60_000,
    hour: 3_600_000,
    day: 86_400_000,
    week: 604_800_000,
  };
  const unit = match?.[2]?.replace(/s$/, '');
  const factor = unit === undefined ? undefined : millisPerUnit[unit];

  if (factor === undefined) {
    return false;
  }
  const millis = Number(match?.[1]) * factor;

  return Number.isFinite(millis) && millis >= 0.0000005;
}

function clockLayer(node: ESTree.Node | undefined, context: Context): boolean {
  return (
    node?.type === 'CallExpression' &&
    node.arguments.length === 0 &&
    apiPath(node.callee, context) === 'TestClock.layer'
  );
}

function clockProvision(gen: ESTree.CallExpression, context: Context): ESTree.CallExpression | undefined {
  const parent = gen.parent;

  if (
    parent.type === 'CallExpression' &&
    apiPath(parent.callee, context) === 'Effect.provide' &&
    parent.arguments[0] === gen &&
    parent.arguments.length === 2 &&
    clockLayer(parent.arguments[1], context)
  ) {
    return parent;
  }
  if (
    parent.type === 'MemberExpression' &&
    parent.object === gen &&
    !parent.computed &&
    parent.property.type === 'Identifier' &&
    parent.property.name === 'pipe' &&
    parent.parent.type === 'CallExpression' &&
    parent.parent.arguments.length === 1
  ) {
    const provision = parent.parent.arguments[0];

    if (
      provision?.type === 'CallExpression' &&
      apiPath(provision.callee, context) === 'Effect.provide' &&
      provision.arguments.length === 1 &&
      clockLayer(provision.arguments[0], context)
    ) {
      return parent.parent;
    }
  }

  return undefined;
}

function clockTest(gen: ESTree.CallExpression, context: Context): boolean {
  const provision = clockProvision(gen, context);
  const provided = provision !== undefined;
  const expression = provision ?? gen;
  let callback = expression.parent;

  if (callback.type === 'ReturnStatement' && callback.parent.type === 'BlockStatement') {
    // A callback that also starts other work may independently drive the clock.
    if (callback.parent.body.length !== 1) {
      return false;
    }
    callback = callback.parent.parent;
  }
  if (callback.type !== 'ArrowFunctionExpression' && callback.type !== 'FunctionExpression') {
    // Only inline top-level provision is proven here; do not follow local variables or nested fibers.
    return (
      provided &&
      enclosingFunction(expression) === undefined &&
      (callback.type === 'VariableDeclarator' || callback.type === 'ExpressionStatement')
    );
  }
  const test = callback.parent;
  const path = test.type === 'CallExpression' ? apiPath(test.callee, context) : undefined;

  return (
    test.type === 'CallExpression' &&
    test.arguments[1] === callback &&
    callback.params.every((parameter) => parameter.type === 'Identifier') &&
    (path === 'Vitest.it.effect' || (provided && (path === 'NativeVitest.it' || path === 'NativeVitest.test')))
  );
}

function yieldedCall(statement: ESTree.Statement): ESTree.CallExpression | undefined {
  if (
    statement.type !== 'ExpressionStatement' ||
    statement.expression.type !== 'YieldExpression' ||
    !statement.expression.delegate ||
    statement.expression.argument?.type !== 'CallExpression'
  ) {
    return undefined;
  }

  const call = statement.expression.argument;

  // Arguments can themselves yield a fork or start an independent clock driver.
  return call.arguments.length === 1 && call.arguments[0]?.type === 'Literal' ? call : undefined;
}

export const noTestclockSleepBeforeAdvance: Rule = defineSyntaxRule(
  {
    type: 'problem',
    docs: {
      description: 'Prevent a same-fiber sleep from blocking a later TestClock advance.',
      recommended: false,
      url: 'https://github.com/Effect-TS/tsgo/issues/477',
    },
    schema: [],
    messages: {
      sleepBeforeAdvance:
        'This sleep blocks the test fiber before its TestClock advance. Fork the sleeping work, advance the clock, then join the fiber.',
    },
  },
  (context) => ({
    CallExpression(gen) {
      if (gen.arguments.length !== 1 || apiPath(gen.callee, context) !== 'Effect.gen' || !clockTest(gen, context)) {
        return;
      }
      const generator = gen.arguments[0];

      if (
        generator?.type !== 'FunctionExpression' ||
        !generator.generator ||
        generator.async ||
        generator.params.length > 0 ||
        generator.body?.type !== 'BlockStatement'
      ) {
        return;
      }
      const sleeps: Array<ESTree.CallExpression> = [];
      const blocked: Array<ESTree.CallExpression> = [];

      for (const statement of generator.body.body) {
        const call = yieldedCall(statement);

        if (!call) {
          return;
        }
        const path = apiPath(call.callee, context);

        if (path === 'Effect.sleep' && positiveDuration(call.arguments[0])) {
          sleeps.push(call);
        } else if (path === 'TestClock.adjust' || path === 'TestClock.setTime') {
          blocked.push(...sleeps);
          sleeps.length = 0;
        } else {
          return;
        }
      }
      for (const sleep of blocked) {
        context.report({ node: sleep, messageId: 'sleepBeforeAdvance' });
      }
    },
  }),
);
