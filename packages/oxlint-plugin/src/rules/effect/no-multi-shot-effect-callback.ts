import type { ESTree, Rule } from '@oxlint/plugins';

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

  const handlerIndex = method === undefined ? undefined : multiShotHandlerIndex.get(method);

  if (handlerIndex === undefined) {
    return false;
  }

  if (method === 'addEventListener') {
    const options = argumentAt(node, 2);

    if (options?.type === 'ObjectExpression') {
      const once = objectProperty(options, 'once');

      if (once !== undefined && isLiteral(once.value, true)) {
        return false;
      }
    }
  }

  const handler = argumentAt(node, handlerIndex);

  return handler !== undefined && containsIdentifier(handler, resume);
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
      if (!isApi(node.callee, getState(), 'Effect', 'callback')) {
        return;
      }

      const register = argumentAt(node, 0);

      if (register === undefined || !isFunctionNode(register)) {
        return;
      }

      const resume = firstIdentifierParameter(register)?.name;

      const body = register.body;

      if (
        resume !== undefined &&
        body &&
        walkNodes(body, (child) => child.type === 'CallExpression' && isMultiShotRegistration(child, resume))
      ) {
        context.report({ node, messageId: 'multiShot' });
      }
    },
  }),
);
