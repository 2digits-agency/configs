import type { ESTree, Rule, Variable } from '@oxlint/plugins';

import { binding, importedApi } from '../../fixes';
import {
  canonicalPath,
  defineEffectRule,
  isFunctionNode,
  ruleMeta,
  staticPath,
  staticPropertyName,
  unwrapExpression,
  walkNodes,
  type FunctionNode,
} from '../../utils';

function constant(variable: Variable): ESTree.VariableDeclarator | undefined {
  const definition = variable.defs[0];

  if (
    variable.defs.length !== 1 ||
    definition?.type !== 'Variable' ||
    definition.node.type !== 'VariableDeclarator' ||
    definition.node.parent.type !== 'VariableDeclaration' ||
    definition.node.parent.kind !== 'const' ||
    variable.references.some((reference) => reference.isWrite() && !reference.init)
  ) {
    return undefined;
  }

  return definition.node;
}

function factory(variable: Variable): FunctionNode | undefined {
  if (variable.references.some((reference) => reference.isWrite() && !reference.init)) {
    return undefined;
  }
  const definition = variable.defs[0];

  if (variable.defs.length === 1 && definition?.node.type === 'FunctionDeclaration') {
    return definition.node;
  }
  const initializer = constant(variable)?.init;

  return initializer && isFunctionNode(initializer) ? initializer : undefined;
}

// A block may only bind local values and return once, unconditionally.
function returned(node: FunctionNode): ESTree.Expression | undefined {
  if (node.async || node.generator || !node.body) {
    return undefined;
  }
  if (node.body.type !== 'BlockStatement') {
    return unwrapExpression(node.body);
  }
  const statements = node.body.body;
  const last = statements.at(-1);

  if (
    last?.type !== 'ReturnStatement' ||
    !last.argument ||
    statements
      .slice(0, -1)
      .some(
        (statement) =>
          statement.type !== 'VariableDeclaration' ||
          statement.kind !== 'const' ||
          statement.declarations.some((declaration) => declaration.id.type !== 'Identifier' || !declaration.init),
      )
  ) {
    return undefined;
  }

  return unwrapExpression(last.argument);
}

function plainData(node: ESTree.Expression): boolean {
  const expression = unwrapExpression(node);

  if (expression.type === 'Literal') {
    return !('regex' in expression);
  }
  if (expression.type === 'ObjectExpression') {
    return expression.properties.every(
      (property) =>
        property.type === 'Property' &&
        property.kind === 'init' &&
        !property.method &&
        !property.computed &&
        plainData(property.value as ESTree.Expression),
    );
  }

  return (
    expression.type === 'ArrayExpression' &&
    expression.elements.every((element) => element !== null && element.type !== 'SpreadElement' && plainData(element))
  );
}

interface Graph {
  readonly calls: Array<ESTree.CallExpression>;
  readonly leaves: Array<ESTree.CallExpression>;
}

interface Construction {
  readonly variable: Variable;
  readonly args: Array<Variable | string>;
  readonly call: ESTree.CallExpression;
}

export const noDuplicateFreshLayerFactory: Rule = defineEffectRule(
  {
    ...ruleMeta(
      'problem',
      'Detect repeated fresh layer factories within one visible composition graph.',
      {
        duplicate:
          'Fresh layer factory {{name}} was already called at {{earlier}} with the same stable arguments. Repeated fresh layers do not share acquisition. If sharing is intended, create one shared value inside this graph owner; keep deliberate isolation explicit.',
      },
      'https://github.com/Effect-TS/tsgo/issues/467',
    ),
    docs: {
      description: 'Detect repeated fresh layer factories within one visible composition graph.',
      url: 'https://github.com/Effect-TS/tsgo/issues/467',
      recommended: false,
    },
  },
  (context, getState) => {
    let calls: Array<ESTree.CallExpression> = [];

    function api(node: ESTree.Expression): string | undefined {
      const path = canonicalPath(node, getState());

      if (!importedApi(context, node)) {
        return undefined;
      }
      const root = staticPath(node)?.[0];
      const variable = root === undefined ? undefined : binding(context, node, root);

      if (
        !variable?.defs.some((definition) => {
          const parent = definition.node.parent;

          return (
            parent?.type === 'ImportDeclaration' &&
            ['effect', 'effect/Layer', 'effect/Function'].includes(parent.source.value)
          );
        })
      ) {
        return undefined;
      }
      if (path?.length === 2 && path[0] === 'Layer') {
        return path[1];
      }

      return path?.join('.') === 'pipe' || path?.join('.') === 'Function.pipe' ? 'pipe' : undefined;
    }

    function composition(node: ESTree.CallExpression): boolean {
      return ['merge', 'mergeAll', 'provide', 'provideMerge'].includes(api(node.callee) ?? '');
    }

    function layerValue(node: ESTree.Expression, seen = new Set<Variable>()): boolean {
      const expression = unwrapExpression(node);

      if (expression.type === 'CallExpression') {
        if (['effect', 'succeed'].includes(api(expression.callee) ?? '')) {
          return expression.arguments.length === 2;
        }
        if (
          composition(expression) ||
          (expression.callee.type === 'MemberExpression' && staticPropertyName(expression.callee) === 'pipe')
        ) {
          return graph(expression, seen) !== undefined;
        }
        if (expression.callee.type === 'Identifier') {
          const variable = binding(context, expression.callee, expression.callee.name);
          const fn = variable && factory(variable);
          const result = fn && returned(fn);

          return !!variable && !seen.has(variable) && !!result && layerValue(result, new Set([...seen, variable]));
        }
      } else if (expression.type === 'Identifier') {
        const variable = binding(context, expression, expression.name);
        const declaration = variable && constant(variable);

        return (
          !!variable &&
          !seen.has(variable) &&
          !!declaration?.init &&
          layerValue(declaration.init, new Set([...seen, variable]))
        );
      }

      return false;
    }

    function transformer(node: ESTree.Expression): ESTree.Expression | undefined {
      if (
        node.type !== 'CallExpression' ||
        node.optional ||
        !composition(node) ||
        api(node.callee) === 'mergeAll' ||
        node.arguments.length !== 1
      ) {
        return undefined;
      }
      const argument = node.arguments[0];

      return argument?.type === 'SpreadElement' ? undefined : argument;
    }

    function pipeInputs(node: ESTree.CallExpression, seen: Set<Variable>): Array<ESTree.Expression> | undefined {
      const callee = node.callee;
      const methodPipe = callee.type === 'MemberExpression' && staticPropertyName(callee) === 'pipe';

      if (!methodPipe && api(callee) !== 'pipe') {
        return undefined;
      }
      const args = node.arguments as Array<ESTree.Expression>;
      const source = methodPipe ? callee.object : args[0];
      const steps = methodPipe ? args : args.slice(1);
      const providers = steps.map((step) => transformer(step));

      if (!source || !layerValue(source, seen) || steps.length === 0 || providers.includes(undefined)) {
        return undefined;
      }

      return [source, ...(providers as Array<ESTree.Expression>)];
    }

    function graphInputs(node: ESTree.CallExpression, seen: Set<Variable>): Array<ESTree.Expression> | undefined {
      if (composition(node)) {
        return api(node.callee) === 'mergeAll' || node.arguments.length === 2
          ? (node.arguments as Array<ESTree.Expression>)
          : undefined;
      }
      const provider = transformer(node.callee);
      const source = node.arguments[0];

      if (source && provider && node.arguments.length === 1 && source.type !== 'SpreadElement') {
        return [source, provider];
      }

      return pipeInputs(node, seen);
    }

    function graph(node: ESTree.Expression, seen = new Set<Variable>()): Graph | undefined {
      const expression = unwrapExpression(node);

      if (
        expression.type !== 'CallExpression' ||
        expression.optional ||
        expression.arguments.some((arg) => arg.type === 'SpreadElement')
      ) {
        return undefined;
      }
      const children = graphInputs(expression, seen);

      if (!children) {
        return undefined;
      }
      // Include data-last transformers so a nested composition is not reported again independently.
      const members = [
        expression,
        ...expression.arguments.filter(
          (arg): arg is ESTree.CallExpression => arg.type === 'CallExpression' && transformer(arg) !== undefined,
        ),
      ];
      const leaves: Array<ESTree.CallExpression> = [];
      const inputs = children.flatMap((child) => {
        const expression = unwrapExpression(child);

        return expression.type === 'ArrayExpression' &&
          expression.elements.every((element) => element !== null && element.type !== 'SpreadElement')
          ? (expression.elements as Array<ESTree.Expression>)
          : [child];
      });

      for (const child of inputs) {
        const nested = graph(child, seen);

        if (nested) {
          members.push(...nested.calls);
          leaves.push(...nested.leaves);
        } else {
          const leaf = unwrapExpression(child);

          if (leaf.type === 'CallExpression' && leaf.callee.type === 'Identifier') {
            leaves.push(leaf);
          }
        }
      }

      return { calls: members, leaves };
    }

    function localValue(
      node: ESTree.Expression,
      owner: FunctionNode,
      seen: Set<Variable>,
    ): ESTree.Expression | undefined {
      let expression = unwrapExpression(node);

      while (expression.type === 'Identifier') {
        const variable = binding(context, expression, expression.name);
        const declaration = variable && constant(variable);

        // Only trace values created inside this factory, never a cached outer layer.
        if (
          !variable ||
          seen.has(variable) ||
          !declaration?.init ||
          declaration.range[0] < owner.range[0] ||
          declaration.range[1] > owner.range[1]
        ) {
          return undefined;
        }

        seen.add(variable);
        expression = unwrapExpression(declaration.init);
      }

      return expression;
    }

    function fresh(node: ESTree.Expression, owner: FunctionNode, seen: Set<Variable>): boolean {
      const expression = localValue(node, owner, seen);

      if (expression?.type !== 'CallExpression' || expression.optional) {
        return false;
      }
      if (['effect', 'succeed'].includes(api(expression.callee) ?? '')) {
        return expression.arguments.length === 2 && expression.arguments.every((arg) => arg.type !== 'SpreadElement');
      }
      const composed = graph(expression);

      if (composed) {
        // Trace the source/root, rather than treating a type annotation or a wrapper as freshness proof.
        const callee = expression.callee;
        const root =
          callee.type === 'MemberExpression' && staticPropertyName(callee) === 'pipe'
            ? callee.object
            : expression.arguments[0];

        return root !== undefined && root.type !== 'SpreadElement' && fresh(root, owner, seen);
      }
      if (expression.callee.type !== 'Identifier') {
        return false;
      }
      const variable = binding(context, expression.callee, expression.callee.name);
      const fn = variable && factory(variable);
      const result = fn && returned(fn);

      return !!variable && !seen.has(variable) && !!fn && !!result && fresh(result, fn, new Set([...seen, variable]));
    }

    function argument(node: ESTree.Expression | ESTree.SpreadElement): Variable | string | undefined {
      if (node.type === 'SpreadElement') {
        return undefined;
      }
      const expression = unwrapExpression(node);

      if (expression.type === 'Literal' && !('regex' in expression)) {
        return `${typeof expression.value}:${String(expression.value)}`;
      }
      if (expression.type !== 'Identifier') {
        return undefined;
      }
      const variable = binding(context, expression, expression.name);
      const declaration = variable && constant(variable);

      if (!variable || !declaration?.init || !plainData(declaration.init)) {
        return undefined;
      }
      if (unwrapExpression(declaration.init).type === 'Literal') {
        return variable; // Primitive constants cannot be mutated by a callee.
      }
      // Const prevents rebinding, not object mutation. Reject aliases and escapes rather than infer their effects.
      const stable = variable.references.every((reference) => {
        if (reference.init) {
          return true;
        }
        const use = reference.identifier;
        const parent = use.parent;

        if (
          parent.type === 'CallExpression' &&
          parent.callee.type === 'Identifier' &&
          parent.arguments.includes(use as ESTree.Expression)
        ) {
          const target = binding(context, parent.callee, parent.callee.name);
          const fn = target && factory(target);
          const result = fn && returned(fn);

          return !!target && !!fn && !!result && fresh(result, fn, new Set([target])) && safeFactory(fn);
        }

        // A wrapped reference can escape through an enclosing call, assignment, or alias.
        return false;
      });

      return stable ? variable : undefined;
    }

    function safeFactory(fn: FunctionNode, seen = new Set<FunctionNode>()): boolean {
      if (seen.has(fn) || fn.params.some((param) => param.type !== 'Identifier')) {
        return false;
      }
      seen.add(fn);
      const parameters = new Set(fn.params.flatMap((param) => (param.type === 'Identifier' ? param.name : [])));

      function usesParameter(node: ESTree.Node): boolean {
        return walkNodes(node, (child) => child.type === 'Identifier' && parameters.has(child.name));
      }

      return !walkNodes(fn, (node) => {
        if (
          ['AssignmentExpression', 'UpdateExpression'].includes(node.type) ||
          (node.type === 'UnaryExpression' && node.operator === 'delete')
        ) {
          return true;
        }
        if (node.type === 'VariableDeclarator' && node.init && usesParameter(node.init)) {
          return true; // Do not infer effects through factory-local argument aliases.
        }
        if (node.type !== 'CallExpression') {
          return false;
        }

        if (parameters.has(staticPath(node.callee)?.[0] ?? '')) {
          return true;
        }
        if (node.arguments.every((arg) => !usesParameter(arg))) {
          return false;
        }
        // Unknown calls receiving a parameter can mutate it. Only trace Effect descriptions or local factories.
        const path = canonicalPath(node.callee, getState());

        if (importedApi(context, node.callee) && ['Layer', 'Effect'].includes(path?.[0] ?? '')) {
          return false;
        }
        if (node.callee.type !== 'Identifier') {
          return true;
        }
        const target = binding(context, node.callee, node.callee.name);
        const nested = target && factory(target);

        return !nested || !returned(nested) || !safeFactory(nested, new Set(seen));
      });
    }

    function construction(leaf: ESTree.CallExpression): Construction | undefined {
      if (leaf.callee.type !== 'Identifier' || leaf.optional) {
        return undefined;
      }
      const variable = binding(context, leaf.callee, leaf.callee.name);
      const fn = variable && factory(variable);
      const result = fn && returned(fn);
      const args = leaf.arguments.map((arg) => argument(arg));

      if (!variable || !fn || !result || !fresh(result, fn, new Set([variable])) || args.includes(undefined)) {
        return undefined;
      }

      return { variable, args: args as Array<Variable | string>, call: leaf };
    }

    function reportDuplicates(leaves: Array<ESTree.CallExpression>): void {
      const groups: Array<Construction> = [];
      const ordered = leaves.toSorted((a, b) => a.range[0] - b.range[0]);

      for (const leaf of ordered) {
        const current = construction(leaf);

        if (!current) {
          continue;
        }
        const previous = groups.find(
          (group) =>
            group.variable === current.variable &&
            group.args.length === current.args.length &&
            group.args.every((arg, index) => arg === current.args[index]),
        );

        if (previous) {
          context.report({
            node: leaf,
            messageId: 'duplicate',
            data: {
              name: current.variable.name,
              earlier: `${previous.call.loc.start.line}:${previous.call.loc.start.column + 1}`,
            },
          });
        } else {
          groups.push(current);
        }
      }
    }

    return {
      before() {
        calls = [];
      },
      CallExpression(node) {
        calls.push(node);
      },
      'Program:exit': function programExit() {
        const consumed = new Set<ESTree.CallExpression>();

        for (const call of calls) {
          if (consumed.has(call)) {
            continue;
          }
          const composed = graph(call);

          if (!composed) {
            continue;
          }
          for (const member of composed.calls) {
            consumed.add(member);
          }
          reportDuplicates(composed.leaves);
        }
      },
    };
  },
);
