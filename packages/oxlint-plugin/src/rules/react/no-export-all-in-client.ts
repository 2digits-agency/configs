import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';

import { ruleMeta } from '../../internal/meta';

export const noExportAllInClient = Rule.define({
  name: 'no-export-all-in-client',
  meta: ruleMeta({
    type: 'problem',
    description: "Disallow `export *` in 'use client' modules, which Next.js does not support.",
    messages: {
      exportAll: "Next.js does not support `export *` in a 'use client' module. Re-export each name instead.",
    },
    url: 'https://nextjs.org/docs/app/api-reference/directives/use-client',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const isClientModule = Arr.some(
      ctx.sourceCode.ast.body,
      (statement) => statement.type === 'ExpressionStatement' && statement.directive === 'use client',
    );

    if (!isClientModule) {
      return {};
    }

    return Visitor.on('ExportAllDeclaration', (node) =>
      node.exportKind !== 'type' && node.parent.type === 'Program'
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'exportAll' }))
        : Effect.void,
    );
  },
});
