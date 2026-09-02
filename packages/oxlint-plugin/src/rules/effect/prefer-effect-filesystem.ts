import type { Rule } from '@oxlint/plugins';

import { defineEffectRule, ruleMeta } from '../../utils';

const nodeFileSystemSources = new Set(['fs', 'fs/promises', 'node:fs', 'node:fs/promises']);

export const preferEffectFileSystem: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Prefer the Effect FileSystem service over direct Node.js filesystem imports in Effect projects.',
    {
      effectFileSystem: 'Use the FileSystem service from effect/FileSystem instead of {{source}}.',
    },
    'https://www.effect.website/docs/v4/api/effect/FileSystem',
  ),
  (context, getState) => ({
    ImportDeclaration(node) {
      if (getState().hasEffectImport && nodeFileSystemSources.has(node.source.value)) {
        context.report({ node: node.source, messageId: 'effectFileSystem', data: { source: node.source.value } });
      }
    },
  }),
);
