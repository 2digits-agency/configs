import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Option from 'effect/Option';
import type * as Result from 'effect/Result';

import { canonicalPath, defineEffectRule, ruleMeta } from '../../utils';
import { domainSection } from './domain';

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
    'Require Alchemy Domain evolve and reply handlers to be total.',
    {
      partial:
        '`{{section}}` must be total and never fail: {{api}} throws when the state is not what it expects. Keep any state the event cannot follow, such as `s._tag === "Open" ? { ...s, ... } : s`.',
    },
    'https://alchemy.run/domain/aggregate',
  ),
  (context, getState) => {
    function report(node: ESTree.Node, api: string): void {
      const found = domainSection(node, getState());

      if (found !== undefined && totalSections.get(found.block)?.has(found.section) === true) {
        context.report({ node, messageId: 'partial', data: { section: found.section, api } });
      }
    }

    return {
      ThrowStatement(node) {
        report(node, '`throw`');
      },
      CallExpression(node) {
        const path = canonicalPath(node.callee, getState());

        if (path?.length === 2 && throwingModules.has(path[0] ?? '') && throwingGetters.has(path[1] ?? '')) {
          report(node, `\`${Arr.join(path, '.')}\``);
        }
      },
    };
  },
);
