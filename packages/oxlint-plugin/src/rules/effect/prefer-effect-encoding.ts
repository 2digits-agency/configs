import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';

import { argumentAt, defineEffectRule, isGlobalIdentifier, isStringLiteral, ruleMeta, staticPath } from '../../utils';

const encodings: ReadonlySet<string> = new Set(['base64', 'base64url', 'hex']);

function isEncodingArgument(node: ESTree.Expression | undefined): boolean {
  return node !== undefined && isStringLiteral(node) && encodings.has(node.value);
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

      const bufferFrom =
        path !== undefined && Arr.join(path, '.') === 'Buffer.from' && isEncodingArgument(argumentAt(node, 1));

      const bufferToString = path?.at(-1) === 'toString' && isEncodingArgument(argumentAt(node, 0));

      if (bufferFrom || bufferToString) {
        context.report({ node, messageId: 'effectEncoding' });
      }
    },
  }),
);
