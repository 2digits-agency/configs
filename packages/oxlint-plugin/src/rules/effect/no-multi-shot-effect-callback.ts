import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as R from 'effect/Record';

import {
  argumentAt,
  containsIdentifier,
  firstIdentifierParameter,
  isFunctionNode,
  isLiteral,
  objectProperty,
  staticPath,
  walkNodes,
} from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

// Repeating event sources, keyed by method, with the index of their handler argument.
const multiShotHandlerIndex: Readonly<Record<string, number>> = {
  addEventListener: 1,
  on: 1,
  setInterval: 0,
};

function isOnceListener(node: ESTree.CallExpression): boolean {
  return Opt.exists(
    argumentAt(node, 2),
    (options) =>
      options.type === 'ObjectExpression' &&
      Opt.exists(objectProperty(options, 'once'), (once) => isLiteral(once.value, true)),
  );
}

function isMultiShotRegistration(node: ESTree.CallExpression, resume: string): boolean {
  return Opt.exists(Opt.map(staticPath(node.callee), Arr.lastNonEmpty), (method) =>
    Opt.exists(
      R.get(multiShotHandlerIndex, method),
      (handlerIndex) =>
        (method !== 'addEventListener' || !isOnceListener(node)) &&
        Opt.exists(argumentAt(node, handlerIndex), (handler) => containsIdentifier(handler, resume)),
    ),
  );
}

/**
 * Whether an `Effect.callback` registration passes its `resume` to a repeating event source.
 *
 * @param node `Effect.callback` call.
 */
function registersMultiShot(node: ESTree.CallExpression): boolean {
  return Opt.exists(argumentAt(node, 0), (register) => {
    if (!isFunctionNode(register) || P.isNullish(register.body)) {
      return false;
    }

    const body = register.body;

    return Opt.exists(firstIdentifierParameter(register), ({ name }) =>
      walkNodes(body, (child) => child.type === 'CallExpression' && isMultiShotRegistration(child, name)),
    );
  });
}

export const noMultiShotEffectCallback: CreateRule = Rule.define({
  name: 'no-multi-shot-effect-callback',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow attaching Effect.callback resume to repeating event sources.',
    messages: {
      multiShot:
        'Effect.callback is single-shot, but this source emits repeatedly. Use a once-style subscription or Stream.callback.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/484',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Effect', 'callback' satisfies keyof typeof Effect) && registersMultiShot(node)
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'multiShot' }))
        : Effect.void,
    );
  },
});
