import type { ESTree, Rule } from '@oxlint/plugins';

import { importedApi, namespaceImport } from '../../fixes';
import {
  argumentAt,
  defineEffectRule,
  firstIdentifierParameter,
  isApi,
  isFunctionNode,
  isGlobalIdentifier,
  ruleMeta,
  walkNodes,
} from '../../utils';

function directlyThrows(body: ESTree.BlockStatement): boolean {
  const pending = body.body.toReversed();

  for (let statement = pending.pop(); statement !== undefined; statement = pending.pop()) {
    switch (statement.type) {
      case 'BlockStatement': {
        pending.push(...statement.body.toReversed());
        break;
      }
      case 'ExpressionStatement':
      case 'VariableDeclaration':
      case 'FunctionDeclaration':
      case 'ClassDeclaration':
      case 'EmptyStatement':
      case 'DebuggerStatement': {
        break;
      }
      default: {
        // Stop at control flow; only a throw reached through straight-line statements is excluded.
        return statement.type === 'ThrowStatement';
      }
    }
  }

  return false;
}

export const noEmptyEffectCallback: Rule = defineEffectRule(
  {
    ...ruleMeta(
      'suggestion',
      'Prefer Effect.never to an empty Effect.callback registration.',
      {
        emptyCallback: 'An empty Effect.callback registration is Effect.never. Use the explicit primitive.',
        unusedResume:
          'This Effect registration never references its completion parameter. Check how it completes, or explicitly suppress this rule for an intentional completion-free adapter.',
      },
      'https://github.com/Effect-TS/tsgo/issues/636',
    ),
    fixable: 'code',
  },
  (context, getState) => ({
    CallExpression(node) {
      if (!isApi(node.callee, getState(), 'Effect', 'callback') && !isApi(node.callee, getState(), 'Effect', 'async')) {
        return;
      }

      const register = argumentAt(node, 0);

      if (register === undefined || !isFunctionNode(register)) {
        return;
      }

      if (register.body?.type === 'BlockStatement' && register.body.body.length === 0) {
        context.report({
          node,
          messageId: 'emptyCallback',
          fix(fixer) {
            if (
              !importedApi(context, node.callee) ||
              node.arguments.length !== 1 ||
              register.async ||
              register.generator ||
              register.params.some((parameter) => parameter.type !== 'Identifier') ||
              context.sourceCode.getCommentsInside(node).length > 0
            ) {
              return;
            }
            const imported = namespaceImport(context, node, 'effect/Effect', 'Effect', fixer);

            return [...imported.fixes, fixer.replaceText(node, `${imported.name}.never`)];
          },
        });
      } else if (!register.async && !register.generator && importedApi(context, node.callee)) {
        const parameter = firstIdentifierParameter(register);

        if (
          parameter === undefined ||
          walkNodes(
            register,
            (child) =>
              (child.type === 'CallExpression' && isGlobalIdentifier(child.callee, context, 'eval')) ||
              (child.type === 'Identifier' &&
                child.name === 'arguments' &&
                context.sourceCode.getScope(child).references.some((reference) => reference.identifier === child)),
          ) ||
          (register.body?.type === 'BlockStatement' && directlyThrows(register.body))
        ) {
          return;
        }

        const completion = context.sourceCode
          .getDeclaredVariables(register)
          .find((variable) => variable.identifiers.includes(parameter));

        if (completion?.references.length === 0) {
          context.report({ node, messageId: 'unusedResume' });
        }
      }
    },
  }),
);
