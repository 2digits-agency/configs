import { type RuleFunction, type RuleToolkit, merge } from '@eslint-react/kit';
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint';

export function preferDestructuringAssignment(): RuleFunction {
  return preferDestructuringAssignmentImpl;
}

function preferDestructuringAssignmentImpl(context: RuleContext, { collect }: RuleToolkit) {
  const { query, visitor } = collect.components(context);

  function programExit(program: TSESTree.Program) {
    for (const { node } of query.all(program)) {
      const [props] = node.params;

      if (props === undefined || props.type !== AST_NODE_TYPES.Identifier) {
        continue;
      }

      const propReferences =
        context.sourceCode.getScope(node).variables.find((variable) => variable.name === props.name)?.references ?? [];

      for (const reference of propReferences) {
        const { parent } = reference.identifier;

        if (parent.type !== AST_NODE_TYPES.MemberExpression) {
          continue;
        }
        context.report({
          message: 'Use destructuring assignment for component props.',
          node: parent,
        });
      }
    }
  }

  return merge(visitor, {
    'Program:exit': programExit,
  });
}
