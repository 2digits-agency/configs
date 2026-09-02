import type { Rule } from '@oxlint/plugins';

import { argumentAt, defineEffectRule, isGlobalIdentifier, isLiteral, ruleMeta, staticPath } from '../../utils';

const encodings = new Set(['base64', 'base64url', 'hex']);

function isEncodingArgument(node: ReturnType<typeof argumentAt>): boolean {
  return node !== undefined && [...encodings].some((encoding) => isLiteral(node, encoding));
}

export const preferEffectEncoding: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect Encoding for portable Base64, Base64Url, and hexadecimal encoding.',
    {
      effectEncoding: 'Use Encoding encode/decode helpers; decoders return Result instead of throwing.',
    },
    'https://www.effect.website/docs/v4/api/effect/Encoding',
  ),
  (context, getState) => ({
    CallExpression(node) {
      if (!getState().hasEffectImport) {
        return;
      }

      if (
        (isGlobalIdentifier(node.callee, context, 'atob') || isGlobalIdentifier(node.callee, context, 'btoa')) &&
        node.arguments.length > 0
      ) {
        context.report({ node, messageId: 'effectEncoding' });

        return;
      }

      const path = staticPath(node.callee);
      const bufferFrom = path?.join('.') === 'Buffer.from' && isEncodingArgument(argumentAt(node, 1));
      const bufferToString = path?.at(-1) === 'toString' && isEncodingArgument(argumentAt(node, 0));

      if (bufferFrom || bufferToString) {
        context.report({ node, messageId: 'effectEncoding' });
      }
    },
  }),
);
