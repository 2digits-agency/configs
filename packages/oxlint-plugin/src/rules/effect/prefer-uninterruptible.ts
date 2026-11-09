import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';

import { argumentAt, functionUsesFirstParameter, isFunctionNode } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

// Effect mask APIs, keyed by member, with the equivalent API to use when `restore` is unused.
const maskReplacements: Readonly<Record<string, keyof typeof Effect>> = {
  interruptibleMask: 'interruptible',
  uninterruptibleMask: 'uninterruptible',
} satisfies Partial<Record<keyof typeof Effect, keyof typeof Effect>>;

export const preferUninterruptible: CreateRule = Rule.define({
  name: 'prefer-uninterruptible',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer the non-mask interruptibility API when the restore callback is unused.',
    messages: {
      unusedRestore:
        'The mask callback never uses restore, so the mask is equivalent to {{replacement}} and misleadingly suggests a restored region.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/659',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) => {
      const replacement = Opt.flatMap(imports.member(node.callee, 'Effect'), (name) => R.get(maskReplacements, name));

      return Opt.isSome(replacement) &&
        Opt.exists(argumentAt(node, 0), (callback) => isFunctionNode(callback) && !functionUsesFirstParameter(callback))
        ? ctx.report(
            Diagnostic.fromId({
              node,
              messageId: 'unusedRestore',
              data: { replacement: `Effect.${replacement.value}` },
            }),
          )
        : Effect.void;
    });
  },
});
