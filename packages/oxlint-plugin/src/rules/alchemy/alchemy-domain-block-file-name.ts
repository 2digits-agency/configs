import type { ESTree, Rule } from '@oxlint/plugins';
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

// Events and rejections may also live in the command, external system or stream file that records or returns them.
const sharedKinds: Partial<Record<DomainBlock, string>> = {
  Event: 'event',
  Rejection: 'rejection',
};

const hostKinds: ReadonlySet<string | undefined> = new Set(['command', 'external', 'stream']);

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

    // Events and rejections in a command or external file, reported at the end unless that file declares its host.
    let shared: Array<{ readonly node: ESTree.Node; readonly block: DomainBlock; readonly kind: string }> = [];

    let hosted = false;

    return {
      before() {
        declared = false;

        shared = [];

        hosted = false;
      },
      'Program:exit': function reportUnhosted() {
        if (!hosted) {
          for (const { node, block, kind } of shared) {
            context.report({ node, messageId: 'fileName', data: { block, kind } });
          }
        }
      },
      CallExpression(node) {
        const block = domainBlock(node, getState(), context);

        const name = Arr.lastNonEmpty(Str.split(context.filename, /[/\\]/u));

        const parts = Str.split(name, '.');

        // `aggregate.ts` and `.aggregate.ts` lack the noun.
        const fileKind = parts.length >= 3 && parts[0] !== '' ? parts.at(-2) : undefined;

        const kind = block === undefined ? undefined : (fileKinds[block] ?? sharedKinds[block]);

        if (block === undefined || kind === undefined || testFile.test(name)) {
          return;
        }

        if (hostKinds.has(fileKind) && sharedKinds[block] !== undefined) {
          shared.push({ node: node.callee, block, kind });

          return;
        }

        if (fileKind === kind && hostKinds.has(fileKind)) {
          hosted = true;
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
