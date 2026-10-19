import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, isGlobalIdentifier, ruleMeta, staticPath } from '../../utils';

const urlParseMethods: ReadonlySet<string> = new Set(['canParse', 'parse']);

export const preferEffectUrl: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer Effect Url helpers for safe URL parsing in Effect projects.',
    {
      effectUrl: 'Use Url.fromString or Url.make so invalid URLs are represented as Result failures.',
    },
    'https://www.effect.website/docs/v4/api/effect/unstable/http/Url',
  ),
  (context, getState) => ({
    NewExpression(node) {
      if (getState().hasEffectImport && isGlobalIdentifier(node.callee, context, 'URL')) {
        context.report({ node, messageId: 'effectUrl' });
      }
    },
    CallExpression(node) {
      const path = staticPath(node.callee);

      if (
        getState().hasEffectImport &&
        path?.[0] === 'URL' &&
        urlParseMethods.has(path[1] ?? '') &&
        node.callee.type === 'MemberExpression' &&
        isGlobalIdentifier(node.callee.object, context, 'URL')
      ) {
        context.report({ node, messageId: 'effectUrl' });
      }
    },
  }),
);
