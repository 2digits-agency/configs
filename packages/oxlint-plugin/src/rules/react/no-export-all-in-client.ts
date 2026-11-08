import type { Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';

import { defineSyntaxRule, ruleMeta } from '../../utils';

export const noExportAllInClient: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    "Disallow `export *` in 'use client' modules, which Next.js does not support.",
    {
      exportAll: "Next.js does not support `export *` in a 'use client' module. Re-export each name instead.",
    },
    'https://nextjs.org/docs/app/api-reference/directives/use-client',
  ),
  (context) => ({
    Program(program) {
      const isClient = Arr.some(
        program.body,
        (statement) => statement.type === 'ExpressionStatement' && statement.directive === 'use client',
      );

      if (!isClient) {
        return;
      }

      for (const statement of program.body) {
        if (statement.type === 'ExportAllDeclaration' && statement.exportKind !== 'type') {
          context.report({ node: statement, messageId: 'exportAll' });
        }
      }
    },
  }),
);
