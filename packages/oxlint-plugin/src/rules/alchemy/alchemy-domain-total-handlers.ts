import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Option from 'effect/Option';
import type * as Result from 'effect/Result';

import { defineEffectRule, ruleMeta } from '../../utils';
import { domainSection, importedPath, isImportReference } from './domain';

const totalSections: ReadonlyMap<string, ReadonlySet<string>> = new Map([
  ['Aggregate', new Set(['evolve', 'reply'])],
  ['View', new Set(['evolve'])],
]);

const throwingModules: ReadonlySet<string> = new Set(['Option', 'Result']);

const throwingGetters: ReadonlySet<string> = new Set(['getOrThrow', 'getOrThrowWith'] satisfies ReadonlyArray<
  keyof typeof Option & keyof typeof Result
>);

export const alchemyDomainTotalHandlers: Rule = defineEffectRule(
  ruleMeta(
    'problem',
    'Require Alchemy Domain evolve and reply handlers to be total, and decide handlers to reject instead of throwing.',
    {
      partial:
        '`{{section}}` must be total and never fail: {{api}} throws when the state is not what it expects. Keep any state the event cannot follow, such as `s._tag === "Open" ? { ...s, ... } : s`.',
      reject:
        '`decide` never throws: {{api}} becomes a defect the caller cannot handle. Return a rejection the command lists in `rejects` instead, or `return yield* rejection` in an `Effect.fn`.',
    },
    'https://alchemy.run/domain/aggregate',
  ),
  (context, getState) => {
    function report(node: ESTree.Node, api: string): void {
      const found = domainSection(node, getState(), context);

      if (found === undefined) {
        return;
      }

      if (found.block === 'Aggregate' && found.section === 'decide') {
        context.report({ node, messageId: 'reject', data: { api } });
      } else if (totalSections.get(found.block)?.has(found.section) === true) {
        context.report({ node, messageId: 'partial', data: { section: found.section, api } });
      }
    }

    function checkGetter(node: ESTree.Node): void {
      const path = importedPath(node, getState(), context);

      if (path?.length === 2 && throwingModules.has(path[0] ?? '') && throwingGetters.has(path[1] ?? '')) {
        report(node, `\`${Arr.join(path, '.')}\``);
      }
    }

    return {
      ThrowStatement(node) {
        report(node, '`throw`');
      },
      // References, not only calls, so point-free `pipe(s.running, Option.getOrThrow)` counts too.
      MemberExpression: checkGetter,
      Identifier(node) {
        if (isImportReference(node, context)) {
          checkGetter(node);
        }
      },
    };
  },
);
