import type { Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Str from 'effect/String';

import { defineEffectRule, ruleMeta } from '../../utils';
import { domainBlock, type DomainBlock } from './domain';

const fileKinds: Partial<Record<DomainBlock, string>> = {
  Aggregate: 'aggregate',
  Api: 'api',
  Command: 'command',
  ExternalSystem: 'external',
  Model: 'model',
  Policy: 'policy',
  Projection: 'projection',
  RequestContext: 'context',
  Saga: 'saga',
  Stream: 'stream',
  View: 'view',
};

// Events and rejections may also live in the command or external system file that records or returns them.
const sharedKinds: Partial<Record<DomainBlock, string>> = {
  Event: 'event',
  Rejection: 'rejection',
};

const hostKinds: ReadonlySet<string | undefined> = new Set(['command', 'external']);

const testFile = /\.(?:test|spec|stories?)\.[cm]?[jt]sx?$/u;

export const alchemyDomainBlockFileName: Rule = defineEffectRule(
  ruleMeta(
    'suggestion',
    'Require one Alchemy Domain block per file, named `<Noun>.<kind>.ts`.',
    {
      fileName: 'Declare this {{block}} in its own `<Noun>.{{kind}}.ts` file.',
      oneBlock: 'Move this {{block}} to its own `<Noun>.{{kind}}.ts` file. Each file declares one Domain block.',
    },
    'https://alchemy.run/domain',
  ),
  (context, getState) => {
    let declared = false;

    return {
      before() {
        declared = false;
      },
      CallExpression(node) {
        const block = domainBlock(node, getState(), context);

        const name = Arr.lastNonEmpty(Str.split(context.filename, /[/\\]/u));

        const parts = Str.split(name, '.');

        // `aggregate.ts` and `.aggregate.ts` lack the noun.
        const fileKind = parts.length >= 3 && parts[0] !== '' ? parts.at(-2) : undefined;

        const kind = block === undefined ? undefined : (fileKinds[block] ?? sharedKinds[block]);

        if (
          kind === undefined ||
          testFile.test(name) ||
          (block !== undefined && hostKinds.has(fileKind) && sharedKinds[block] !== undefined)
        ) {
          return;
        }

        if (declared) {
          context.report({ node: node.callee, messageId: 'oneBlock', data: { block, kind } });
        } else if (fileKind !== kind) {
          context.report({ node: node.callee, messageId: 'fileName', data: { block, kind } });
        }

        declared = true;
      },
    };
  },
);
