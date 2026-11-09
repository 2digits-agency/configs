import type { ESTree, Rule } from '@oxlint/plugins';
import type * as Effect from 'effect/Effect';
import * as P from 'effect/Predicate';

import {
  argumentAt,
  containsIdentifier,
  defineEffectRule,
  firstIdentifierParameter,
  isApi,
  isFunctionNode,
  isLiteral,
  objectProperty,
  ruleMeta,
  staticPath,
  walkNodes,
} from '../../utils';

// Repeating event sources, keyed by method, with the index of their handler argument.
const multiShotHandlerIndex: ReadonlyMap<string, number> = new Map([
  ['addEventListener', 1],
  ['on', 1],
  ['setInterval', 0],
]);

function isMultiShotRegistration(node: ESTree.CallExpression, resume: string): boolean {
  const method = staticPath(node.callee)?.at(-1);

  const handlerIndex = P.isUndefined(method) ? undefined : multiShotHandlerIndex.get(method);

  if (P.isUndefined(handlerIndex)) {
    return false;
  }

  if (method === 'addEventListener') {
    const options = argumentAt(node, 2);

    if (options?.type === 'ObjectExpression') {
      const once = objectProperty(options, 'once');

      if (P.isNotUndefined(once) && isLiteral(once.value, true)) {
        return false;
      }
    }
  }

  const handler = argumentAt(node, handlerIndex);

  return P.isNotUndefined(handler) && containsIdentifier(handler, resume);
}

export const noMultiShotEffectCallback: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Disallow attaching Effect.callback resume to repeating event sources.',
    {
      multiShot:
        'Effect.callback is single-shot, but this source emits repeatedly. Use a once-style subscription or Stream.callback.',
    },
    'https://github.com/Effect-TS/tsgo/issues/484',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!isApi(node.callee, getState(), 'Effect', 'callback' satisfies keyof typeof Effect)) {
        return;
      }

      const register = argumentAt(node, 0);

      if (P.isUndefined(register) || !isFunctionNode(register)) {
        return;
      }

      const resume = firstIdentifierParameter(register)?.name;

      const body = register.body;

      if (
        body &&
        P.isNotUndefined(resume) &&
        walkNodes(body, (child) => child.type === 'CallExpression' && isMultiShotRegistration(child, resume))
      ) {
        context.report({ node, messageId: 'multiShot' });
      }
    },
  }),
);
