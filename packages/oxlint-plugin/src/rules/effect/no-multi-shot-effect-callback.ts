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

function isMultiShotRegistration(node: ESTree.CallExpression, resume: string): boolean {
  const path = staticPath(node.callee);
  const method = path?.at(-1);

  if (method === undefined || !['addEventListener', 'on', 'setInterval'].includes(method)) {
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

  const handler = argumentAt(node, method === 'setInterval' ? 0 : 1);

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
