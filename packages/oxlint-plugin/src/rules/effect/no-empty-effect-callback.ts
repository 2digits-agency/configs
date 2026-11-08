import type { Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Effect from 'effect/Effect';
import * as P from 'effect/Predicate';

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
      if (
        !isApi(node.callee, getState(), 'Effect', 'callback' satisfies keyof typeof Effect) &&
        // Effect v3 name, which the current Effect types no longer export.
        !isApi(node.callee, getState(), 'Effect', 'async')
      ) {
        return;
      }

      const register = argumentAt(node, 0);

      if (
        P.isNotUndefined(register) &&
        isFunctionNode(register) &&
        register.body?.type === 'BlockStatement' &&
        Arr.isReadonlyArrayEmpty(register.body.body)
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
              Arr.some(register.params, (parameter) => parameter.type !== 'Identifier') ||
              Arr.isReadonlyArrayNonEmpty(context.sourceCode.getCommentsInside(node))
            ) {
              return;
            }

            const imported = namespaceImport(context, node, 'effect/Effect', 'Effect', fixer);

            return [
              ...imported.fixes,
              fixer.replaceText(node, `${imported.name}.${'never' satisfies keyof typeof Effect}`),
            ];
          },
        });
      }
    },
  }),
);
