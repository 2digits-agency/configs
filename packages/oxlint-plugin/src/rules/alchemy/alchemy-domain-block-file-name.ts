import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { domainBlock, type DomainBlock, type DomainFile } from './internal/domain';

const fileKinds: Readonly<Record<string, string>> = {
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
const sharedKinds: Readonly<Record<string, string>> = {
  Event: 'event',
  Rejection: 'rejection',
};

const isHostKind = Schema.is(Schema.Literals(['command', 'external', 'stream']));

const TestFile = Schema.String.check(Schema.isPattern(/\.(?:test|spec|stories?)\.[cm]?[jt]sx?$/u));

const isTestFile = Schema.is(TestFile);

/**
 * A Domain block declaration and the file kind it belongs in.
 */
interface Declaration {
  readonly node: ESTree.Node;
  readonly block: DomainBlock;
  readonly kind: string;
}

/**
 * The kind a file name declares, such as `aggregate` for `Order.aggregate.ts`. `aggregate.ts` and `.aggregate.ts` lack
 * the noun, so they declare none.
 *
 * @param name File name without directories.
 */
function fileKindOf(name: string): Opt.Option<string> {
  const parts = Str.split(name, '.');

  return parts.length >= 3 && Str.isNonEmpty(Arr.headNonEmpty(parts)) ? Arr.get(parts, parts.length - 2) : Opt.none();
}

export const alchemyDomainBlockFileName: CreateRule = defineRule({
  name: 'alchemy-domain-block-file-name',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Require one Alchemy Domain block per file, named `<Noun>.<kind>.ts`.',
    messages: {
      fileName: 'Declare this {{block}} in its own `<Noun>.{{kind}}.ts` file.',
      oneBlock: 'Move this {{block}} to its own `<Noun>.{{kind}}.ts` file. Each file declares one Domain block.',
    },
    url: 'https://alchemy.run/domain',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const file: DomainFile = { sourceCode: ctx.sourceCode, imports: yield* importBindings };

    if (!file.imports.hasNamespace('Domain')) {
      return {};
    }

    const name = Arr.lastNonEmpty(Str.split(ctx.filename, /[/\\]/u));

    if (isTestFile(name)) {
      return {};
    }

    const fileKind = fileKindOf(name);

    const inHostFile = Opt.exists(fileKind, isHostKind);

    const declared = yield* Ref.make(false);

    // Whether the command, external or stream file declares its host block, so its events and rejections may stay.
    const hosted = yield* Ref.make(false);

    function declaration(node: ESTree.Node): Opt.Option<Declaration> {
      return node.type === 'CallExpression'
        ? Opt.flatMap(domainBlock(node, file), (block) =>
            Opt.map(
              Opt.orElse(R.get(fileKinds, block), () => R.get(sharedKinds, block)),
              (kind): Declaration => ({ node: node.callee, block, kind }),
            ),
          )
        : Opt.none();
    }

    function isShared({ block }: Declaration) {
      return inHostFile && R.has(sharedKinds, block);
    }

    function report(messageId: 'fileName' | 'oneBlock', { node, block, kind }: Declaration) {
      return ctx.report(Diagnostic.fromId({ node, messageId, data: { block, kind } }));
    }

    // Only host files can accumulate shared declarations; other files need no second call visitor or exit pass.
    const sharedDeclarations = yield* inHostFile
      ? Visitor.accumulate(
          'CallExpression',
          (node) => Opt.filter(declaration(node), isShared),
          (shared) =>
            Effect.flatMap(Ref.get(hosted), (isHosted) =>
              // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
              isHosted ? Effect.void : Effect.forEach(shared, (found) => report('fileName', found), { discard: true }),
            ),
        )
      : Effect.succeed({});

    const check = Effect.fnUntraced(function* (found: Declaration) {
      const matchesFile = Opt.contains(fileKind, found.kind);

      if (matchesFile && inHostFile) {
        yield* Ref.set(hosted, true);
      }

      if (yield* Ref.getAndSet(declared, true)) {
        yield* report('oneBlock', found);
      } else if (!matchesFile) {
        yield* report('fileName', found);
      }
    });

    return Visitor.merge(
      sharedDeclarations,
      Visitor.on('CallExpression', (node) =>
        Opt.match(
          Opt.filter(declaration(node), (found) => !isShared(found)),
          { onNone: () => Effect.void, onSome: check },
        ),
      ),
    );
  },
});
