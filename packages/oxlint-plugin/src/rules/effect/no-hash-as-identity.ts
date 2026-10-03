import type { ESTree, Rule, Scope, Variable } from '@oxlint/plugins';

import { importedApi } from '../../fixes';
import {
  argumentAt,
  canonicalPath,
  defineEffectRule,
  isGlobalIdentifier,
  isLiteral,
  ruleMeta,
  staticPath,
  staticPropertyName,
} from '../../utils';

function initializer(variable: Variable | undefined): ESTree.Expression | undefined {
  if (variable?.defs.length !== 1 || variable.references.some((reference) => reference.isWrite() && !reference.init)) {
    return undefined;
  }
  const declaration = variable.defs[0]?.node;

  return declaration?.type === 'VariableDeclarator' && declaration.id.type === 'Identifier'
    ? (declaration.init ?? undefined)
    : undefined;
}

function returnsFalse(statement: ESTree.Statement): boolean {
  if (statement.type === 'BlockStatement') {
    return statement.body.length === 1 && statement.body[0] !== undefined && returnsFalse(statement.body[0]);
  }

  return statement.type === 'ReturnStatement' && statement.argument !== null && isLiteral(statement.argument, false);
}

export const noHashAsIdentity: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow using Hash.hash output as collision-free identity.',
    {
      hashIdentity:
        'Hash.hash is a bucketing hint, not a unique identity. Use HashMap/Equal.equals or a real identifier instead.',
    },
    'https://github.com/Effect-TS/tsgo/issues/482',
  ),
  (context, getState) => {
    function binding(node: ESTree.Node, name: string): Variable | undefined {
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

    function apiPath(node: ESTree.Node, seen = new Set<Variable>()): ReadonlyArray<string> | undefined {
      if (importedApi(context, node)) {
        return canonicalPath(node, getState());
      }
      const path = staticPath(node);
      const name = path?.[0];
      const variable = name === undefined ? undefined : binding(node, name);
      const init = initializer(variable);

      if (path === undefined || variable === undefined || init === undefined || seen.has(variable)) {
        return undefined;
      }
      seen.add(variable);
      const imported = apiPath(init, seen);

      return imported === undefined ? undefined : [...imported, ...path.slice(1)];
    }

    function isApi(node: ESTree.Node, namespace: string, member: string): boolean {
      const path = apiPath(node);

      return path?.length === 2 && path[0] === namespace && path[1] === member;
    }

    function hashCall(node: ESTree.Node): ESTree.CallExpression | undefined {
      const seen = new Set<Variable>();
      let current = node;

      for (;;) {
        if (current.type === 'CallExpression' && isApi(current.callee, 'Hash', 'hash')) {
          return current;
        }
        const variable = current.type === 'Identifier' ? binding(current, current.name) : undefined;
        const init = initializer(variable);

        if (variable === undefined || init === undefined || seen.has(variable)) {
          return undefined;
        }
        seen.add(variable);
        current = init;
      }
    }

    function sameInput(input: ESTree.Node | undefined, argument: ESTree.Node | undefined): boolean {
      if (input?.type !== 'Identifier' || argument?.type !== 'Identifier') {
        return false;
      }
      const variable = binding(input, input.name);

      return (
        variable?.defs.length === 1 &&
        variable === binding(argument, argument.name) &&
        variable.references.every((reference) => !reference.isWrite() || reference.init)
      );
    }

    function fullComparison(expression: ESTree.Node | undefined, comparison: ESTree.BinaryExpression): boolean {
      if (
        expression?.type !== 'CallExpression' ||
        expression.arguments.length !== 2 ||
        (!isApi(expression.callee, 'Equal', 'equals') &&
          !isGlobalIdentifier(expression.callee, context, 'fullEquality'))
      ) {
        return false;
      }
      const left = hashCall(comparison.left);
      const right = hashCall(comparison.right);
      const a = left === undefined ? undefined : argumentAt(left, 0);
      const b = right === undefined ? undefined : argumentAt(right, 0);
      const x = argumentAt(expression, 0);
      const y = argumentAt(expression, 1);

      return (sameInput(a, x) && sameInput(b, y)) || (sameInput(a, y) && sameInput(b, x));
    }

    function safeRejection(node: ESTree.BinaryExpression): boolean {
      const guard = node.parent;

      if (['===', '=='].includes(node.operator)) {
        return (
          guard.type === 'LogicalExpression' &&
          guard.operator === '&&' &&
          guard.left === node &&
          fullComparison(guard.right, node)
        );
      }

      if (
        !['!==', '!='].includes(node.operator) ||
        guard.type !== 'IfStatement' ||
        guard.test !== node ||
        guard.alternate !== null ||
        !returnsFalse(guard.consequent) ||
        guard.parent.type !== 'BlockStatement' ||
        !['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(guard.parent.parent.type)
      ) {
        return false;
      }
      const statements = guard.parent.body;
      const next = statements[statements.indexOf(guard) + 1];

      return next?.type === 'ReturnStatement' && fullComparison(next.argument ?? undefined, node);
    }

    return {
      CallExpression(node) {
        if (
          node.callee.type !== 'MemberExpression' ||
          !['delete', 'get', 'has', 'set'].includes(staticPropertyName(node.callee) ?? '')
        ) {
          return;
        }

        const key = argumentAt(node, 0);

        if (key !== undefined && hashCall(key)) {
          context.report({ node: key, messageId: 'hashIdentity' });
        }
      },
      BinaryExpression(node) {
        if (
          ['===', '!==', '==', '!='].includes(node.operator) &&
          hashCall(node.left) &&
          hashCall(node.right) &&
          !safeRejection(node)
        ) {
          context.report({ node, messageId: 'hashIdentity' });
        }
      },
      MemberExpression(node) {
        if (node.computed && hashCall(node.property)) {
          context.report({ node: node.property, messageId: 'hashIdentity' });
        }
      },
    };
  },
);
