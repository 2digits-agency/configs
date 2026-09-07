import type { Rule } from '@oxlint/plugins';

import { importedApi, namespaceImport } from '../../fixes';
import { argumentAt, defineEffectRule, isApi, isFunctionNode, ruleMeta } from '../../utils';

export const noEmptyEffectCallback: Rule = defineEffectRule(
  {
    ...ruleMeta(
      'suggestion',
      'Prefer Effect.never to an empty Effect.callback registration.',
      {
        emptyCallback: 'An empty Effect.callback registration is Effect.never. Use the explicit primitive.',
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

      if (
        register !== undefined &&
        isFunctionNode(register) &&
        register.body?.type === 'BlockStatement' &&
        register.body.body.length === 0
      ) {
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
      }
    },
  }),
);
