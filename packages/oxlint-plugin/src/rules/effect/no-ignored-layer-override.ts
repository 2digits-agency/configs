import type { Context, ESTree, Rule, Scope, Variable } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import { argumentAt, defineEffectRule, isApi, ruleMeta, staticPropertyName, unwrapExpression } from '../../utils';

interface PackedDependency {
  readonly open: string;
  readonly packed: string;
  readonly provider: ESTree.CallExpression;
}

interface Graph {
  readonly open: string;
  readonly required: ReadonlySet<Variable>;
  readonly packed: ReadonlyMap<Variable, PackedDependency>;
}

function binding(context: Context, node: ESTree.IdentifierReference): Variable | undefined {
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

function referenceExpression(input: Exclude<ESTree.Node, ESTree.Program>): Exclude<ESTree.Node, ESTree.Program> {
  let node = input;

  for (;;) {
    const parent = node.parent;

    switch (parent.type) {
      case 'ParenthesizedExpression':
      case 'TSAsExpression':
      case 'TSNonNullExpression':
      case 'TSSatisfiesExpression':
      case 'TSTypeAssertion': {
        node = parent;
        break;
      }
      default: {
        return node;
      }
    }
  }
}

function writtenThrough(input: ESTree.Node): boolean {
  let node = input;

  while (node.type !== 'Program') {
    const parent = node.parent;

    switch (parent.type) {
      case 'AssignmentExpression':
      case 'ForInStatement':
      case 'ForOfStatement': {
        return parent.left === node;
      }
      case 'UpdateExpression': {
        return true;
      }
      case 'UnaryExpression': {
        return parent.operator === 'delete';
      }
      case 'MemberExpression': {
        if (parent.object !== node) {
          return false;
        }
        break;
      }
      case 'Property': {
        if (parent.value !== node) {
          return false;
        }
        break;
      }
      case 'AssignmentPattern': {
        if (parent.left !== node) {
          return false;
        }
        break;
      }
      case 'ObjectPattern':
      case 'ArrayPattern':
      case 'RestElement':
      case 'ParenthesizedExpression':
      case 'TSAsExpression':
      case 'TSNonNullExpression':
      case 'TSSatisfiesExpression':
      case 'TSTypeAssertion': {
        break;
      }
      default: {
        return false;
      }
    }
    node = parent;
  }

  return false;
}

function immutable(context: Context, variable: Variable, seen: ReadonlySet<Variable> = new Set()): boolean {
  if (seen.has(variable)) {
    return true;
  }

  return variable.references.every((reference) => {
    if ((reference.isWrite() && !reference.init) || writtenThrough(reference.identifier)) {
      return false;
    }
    const node = referenceExpression(reference.identifier);
    const parent = node.parent;

    if (parent.type === 'VariableDeclarator' && parent.init === node) {
      return context.sourceCode
        .getDeclaredVariables(parent)
        .every((alias) => immutable(context, alias, new Set([...seen, variable])));
    }

    return true;
  });
}

function initializer(context: Context, variable: Variable): ESTree.Expression | undefined {
  const definition = variable.defs.length === 1 ? variable.defs[0] : undefined;

  if (!immutable(context, variable)) {
    return undefined;
  }
  if (
    definition?.type === 'ClassName' &&
    definition.node.type === 'ClassDeclaration' &&
    definition.node.body.body.length === 0
  ) {
    return definition.node.superClass ?? undefined;
  }
  if (
    definition?.type !== 'Variable' ||
    definition.node.type !== 'VariableDeclarator' ||
    definition.node.id.type !== 'Identifier' ||
    definition.parent?.type !== 'VariableDeclaration' ||
    definition.parent.kind !== 'const'
  ) {
    return undefined;
  }

  return definition.node.init ?? undefined;
}

function constructionValues(statement: ESTree.Statement): Array<ESTree.Expression | null> | undefined {
  if (statement.type === 'VariableDeclaration') {
    return statement.declarations.map((declaration) => declaration.init);
  }

  return statement.type === 'ExpressionStatement' ? [statement.expression] : undefined;
}

export const noIgnoredLayerOverride: Rule = defineEffectRule(
  {
    ...ruleMeta(
      'problem',
      'Detect ignored outer overrides of locally proven packed Layer dependencies.',
      {
        ignoredOverride:
          '{{packed}} already supplies {{tag}} to the constructor of {{open}}. This later provider cannot reach that constructor. Use the open layer {{open}} or rebuild the composition.',
      },
      'https://github.com/Effect-TS/tsgo/issues/487',
    ),
    docs: {
      description: 'Detect ignored outer overrides of locally proven packed Layer dependencies.',
      recommended: false,
      url: 'https://github.com/Effect-TS/tsgo/issues/487',
    },
  },
  (context, getState) => {
    function api(node: ESTree.Expression, namespace: string, member: string): boolean {
      return importedApi(context, node) && isApi(node, getState(), namespace, member);
    }

    function resolve(
      input: ESTree.Expression,
      seen: ReadonlySet<Variable> = new Set(),
    ): { readonly node: ESTree.Expression; readonly variable?: Variable } | undefined {
      const node = unwrapExpression(input);

      if (node.type !== 'Identifier') {
        return { node };
      }
      const variable = binding(context, node);
      const value = variable === undefined ? undefined : initializer(context, variable);

      if (variable === undefined || value === undefined || seen.has(variable)) {
        return undefined;
      }
      const resolved = resolve(value, new Set([...seen, variable]));

      return resolved === undefined ? undefined : { node: resolved.node, variable: resolved.variable ?? variable };
    }

    function tag(input: ESTree.Expression): Variable | undefined {
      const resolved = resolve(input);
      const node = resolved?.node;
      const key = node?.type === 'CallExpression' ? argumentAt(node, 0) : undefined;

      return node?.type === 'CallExpression' &&
        node.arguments.length === 1 &&
        key?.type === 'Literal' &&
        typeof key.value === 'string' &&
        (api(node.callee, 'Context', 'Service') ||
          (node.callee.type === 'CallExpression' &&
            node.callee.arguments.length === 0 &&
            api(node.callee.callee, 'Context', 'Service')))
        ? resolved?.variable
        : undefined;
    }

    function supplied(
      input: ESTree.Expression,
    ): { readonly tag: Variable; readonly node: ESTree.CallExpression } | undefined {
      const node = resolve(input)?.node;
      const output = node?.type === 'CallExpression' ? argumentAt(node, 0) : undefined;

      if (
        !output ||
        node?.type !== 'CallExpression' ||
        node.arguments.length !== 2 ||
        !api(node.callee, 'Layer', 'succeed')
      ) {
        return undefined;
      }
      const dependency = tag(output);

      return dependency === undefined ? undefined : { tag: dependency, node };
    }

    function construction(input: ESTree.Expression): ReadonlySet<Variable> | undefined {
      const node = resolve(input)?.node;

      if (node?.type !== 'CallExpression' || !api(node.callee, 'Effect', 'gen') || node.arguments.length !== 1) {
        return undefined;
      }
      const generator = argumentAt(node, 0);

      if (
        generator?.type !== 'FunctionExpression' ||
        !generator.generator ||
        generator.async ||
        generator.body?.type !== 'BlockStatement'
      ) {
        return undefined;
      }

      return constructionRequirements(generator.body);
    }

    function constructionRequirements(body: ESTree.BlockStatement): ReadonlySet<Variable> | undefined {
      const required = new Set<Variable>();

      // Only unconditional, direct yields in the generator body prove construction consumption.
      // Do not descend into returned methods, callbacks, branches, or arbitrary helpers.
      for (const statement of body.body) {
        if (statement.type === 'ReturnStatement') {
          break;
        }
        const values = constructionValues(statement);

        if (values === undefined) {
          return undefined;
        }
        for (const value of values) {
          if (value?.type !== 'YieldExpression' || !value.delegate || !value.argument) {
            continue;
          }

          const dependency = tag(value.argument);

          if (dependency === undefined) {
            return undefined;
          }
          required.add(dependency);
        }
      }

      return required;
    }

    function provide(graph: Graph, provider: ESTree.Expression): Graph | undefined {
      const dependency = supplied(provider);

      if (dependency === undefined) {
        return undefined;
      }
      const required = new Set(graph.required);
      const packed = new Map(graph.packed);

      if (required.delete(dependency.tag)) {
        packed.set(dependency.tag, { open: graph.open, packed: graph.open, provider: dependency.node });
      }

      return { ...graph, required, packed };
    }

    function namedGraph(node: ESTree.IdentifierReference, seen: ReadonlySet<Variable>): Graph | undefined {
      const variable = binding(context, node);
      const value = variable === undefined ? undefined : initializer(context, variable);

      if (variable === undefined || value === undefined || seen.has(variable)) {
        return undefined;
      }
      const result = graph(value, new Set([...seen, variable]));

      return result === undefined
        ? undefined
        : {
            ...result,
            open: result.packed.size === 0 ? variable.name : result.open,
            packed: new Map(
              [...result.packed].map(([dependency, packed]) => [dependency, { ...packed, packed: variable.name }]),
            ),
          };
    }

    function graph(input: ESTree.Expression, seen: ReadonlySet<Variable> = new Set()): Graph | undefined {
      const node = unwrapExpression(input);

      if (node.type === 'Identifier') {
        return namedGraph(node, seen);
      }
      if (node.type !== 'CallExpression') {
        return undefined;
      }
      const effect = argumentAt(node, 1);

      if (effect && node.arguments.length === 2 && api(node.callee, 'Layer', 'effect')) {
        const required = construction(effect);

        return required === undefined ? undefined : { open: 'Layer.effect', required, packed: new Map() };
      }
      const steps = provisions(node);

      if (steps === undefined) {
        return undefined;
      }
      let result = graph(steps.source, seen);

      for (const step of steps.providers) {
        result = result === undefined ? undefined : provide(result, step.provider);
      }

      return result;
    }

    function provisions(node: ESTree.CallExpression):
      | {
          readonly source: ESTree.Expression;
          readonly providers: Array<{ readonly node: ESTree.CallExpression; readonly provider: ESTree.Expression }>;
        }
      | undefined {
      const source = argumentAt(node, 0);
      const provider = argumentAt(node, 1);

      if (source && provider && node.arguments.length === 2 && api(node.callee, 'Layer', 'provide')) {
        return { source, providers: [{ node, provider }] };
      }
      if (node.callee.type !== 'MemberExpression' || staticPropertyName(node.callee) !== 'pipe' || node.optional) {
        return undefined;
      }
      const providers: Array<{ node: ESTree.CallExpression; provider: ESTree.Expression }> = [];

      for (const argument of node.arguments) {
        if (
          argument.type !== 'CallExpression' ||
          !api(argument.callee, 'Layer', 'provide') ||
          argument.arguments.length !== 1
        ) {
          return undefined;
        }
        const dependency = argumentAt(argument, 0);

        if (dependency === undefined) {
          return undefined;
        }
        providers.push({ node: argument, provider: dependency });
      }

      return { source: node.callee.object, providers };
    }

    return {
      CallExpression(node) {
        const steps = provisions(node);

        if (steps === undefined) {
          return;
        }
        let current = graph(steps.source);

        for (const step of steps.providers) {
          if (current === undefined) {
            return;
          }
          const dependency = supplied(step.provider);
          const packed = dependency === undefined ? undefined : current.packed.get(dependency.tag);

          if (dependency !== undefined && packed !== undefined && packed.provider !== dependency.node) {
            context.report({
              node: step.node,
              messageId: 'ignoredOverride',
              data: { tag: dependency.tag.name, packed: packed.packed, open: packed.open },
            });
          }
          current = provide(current, step.provider);
        }
      },
    };
  },
);
