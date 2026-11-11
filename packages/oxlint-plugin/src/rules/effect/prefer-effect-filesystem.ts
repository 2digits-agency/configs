import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const NodeFileSystemSource = Schema.Literals(['fs', 'fs/promises', 'node:fs', 'node:fs/promises']);

const isNodeFileSystemSource = Schema.is(NodeFileSystemSource);

export const preferEffectFileSystem = Rule.define({
  name: 'prefer-effect-filesystem',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer the Effect FileSystem service over direct Node.js filesystem imports in Effect projects.',
    messages: { effectFileSystem: 'Use the FileSystem service from effect/FileSystem instead of {{source}}.' },
    url: 'https://www.effect.website/docs/v4/api/effect/FileSystem',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    return Visitor.on('ImportDeclaration', ({ source }) =>
      isNodeFileSystemSource(source.value)
        ? ctx.report(Diagnostic.fromId({ node: source, messageId: 'effectFileSystem', data: { source: source.value } }))
        : Effect.void,
    );
  },
});
