import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, objectProperty } from '../../internal/ast';
import { plainOptions, withOptionalFix } from '../../internal/fixes';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isImportedApi } from '../../internal/scope';
import { isCloudflareWorker } from './internal/worker';

const renamedProperties = [
  ['entrypoint', 'main'],
  ['bindings', 'env'],
] as const;

export const alchemyNoV1WorkerProperties: CreateRule = Rule.define({
  name: 'alchemy-no-v1-worker-properties',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow Alchemy v1 Cloudflare Worker property names.',
    messages: {
      property: 'Cloudflare.Worker {{old}} was replaced in v2. Use {{replacement}}.',
    },
    url: 'https://alchemy.run/migrating-from-v1',
    fixable: 'code',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    const check = Effect.fnUntraced(function* (node: ESTree.CallExpression, options: ESTree.ObjectExpression) {
      const imported = yield* isImportedApi(node.callee);

      const renamed = Arr.flatMap(renamedProperties, ([old, replacement]) =>
        Opt.toArray(Opt.map(objectProperty(options, old), (property) => ({ old, replacement, property }))),
      );

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      yield* Effect.forEach(
        renamed,
        ({ old, replacement, property }) =>
          ctx.report(
            withOptionalFix(
              Diagnostic.fromId({ node: property, messageId: 'property', data: { old, replacement } }),
              Opt.liftPredicate(
                Diagnostic.replaceText(property.key, property.shorthand ? `${replacement}: ${old}` : replacement),
                () => imported && plainOptions(options, replacement),
              ),
            ),
          ),
        { discard: true },
      );
    });

    return Visitor.on('CallExpression', (node) =>
      Opt.match(
        argumentAt(node, 1).pipe(
          Opt.filter(() => isCloudflareWorker(node.callee, imports)),
          Opt.filter((options): options is ESTree.ObjectExpression => options.type === 'ObjectExpression'),
        ),
        { onNone: () => Effect.void, onSome: (options) => check(node, options) },
      ),
    );
  },
});
