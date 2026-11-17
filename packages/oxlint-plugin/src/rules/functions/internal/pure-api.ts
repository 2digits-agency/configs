import type { ESTree, OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as P from 'effect/Predicate';
import * as Schema from 'effect/Schema';

import { isFunctionNode } from '../../../internal/ast';
import { lookupVariable, soleDefinition } from '../../../internal/scope';

/**
 * Modules whose functions build immutable values or lazy descriptions, so calling them once is the same as calling them
 * on every use.
 */
const isPureModule = Schema.is(
  Schema.Literals([
    'BigDecimal',
    'Config',
    'Data',
    'DateTime',
    'Duration',
    'Effect',
    'Equivalence',
    'Exit',
    'Function',
    'Layer',
    'Match',
    'Option',
    'Order',
    'Predicate',
    'Result',
    'Schedule',
    'Schema',
    'Stream',
    'String',
    'Struct',
    'flow',
    'pipe',
  ]),
);

// `Effect.runSync`, `DateTime.nowUnsafe`, `Ref.makeUnsafe` and similar run effects or read mutable state.
const impureMember = /^run|unsafe/iu;

/**
 * Whether an import path names a function of a pure module, such as `['Option', 'map']`, so its result does not depend
 * on when it is called.
 *
 * @param path Import path of the callee.
 */
export function isPureApi(path: ReadonlyArray<string>): boolean {
  return Opt.exists(Arr.head(path), isPureModule) && !Arr.some(path, (part) => impureMember.test(part));
}

/*
 * Modules whose functions call their callbacks right away, such as `Option.map(some, f)` or `pipe(value, f)`, so the
 * result is only constant when no function argument can read changing state.
 */
const isEagerModule = Schema.is(
  Schema.Literals([
    'BigDecimal',
    'Data',
    'DateTime',
    'Duration',
    'Exit',
    'Option',
    'Result',
    'String',
    'Struct',
    'pipe',
  ]),
);

const isEagerMember = Schema.is(Schema.Literals(['pipe', 'value', 'valueTags']));

/**
 * Whether an import path names a function that calls its callbacks right away, such as `Option.getOrElse(o, f)` or
 * `pipe(value, f)`.
 *
 * @param path Import path of the callee.
 */
export function isEagerApi(path: ReadonlyArray<string>): boolean {
  return Opt.exists(Arr.head(path), isEagerModule) || Opt.exists(Arr.get(path, 1), isEagerMember);
}

/**
 * Whether an argument is a function whose body the caller doesn't see: an inline function, or a local or imported
 * function binding.
 *
 * @param node Argument.
 * @param sourceCode Source of the file.
 */
export function isLocalFunction(node: ESTree.Node, sourceCode: OxlintSourceCode): boolean {
  if (node.type !== 'Identifier') {
    return isFunctionNode(node);
  }

  return Opt.exists(
    soleDefinition(lookupVariable(sourceCode, node, node.name)),
    (definition) =>
      definition.type === 'FunctionName' ||
      definition.type === 'ImportBinding' ||
      (definition.type === 'Variable' &&
        definition.node.type === 'VariableDeclarator' &&
        P.isNotNull(definition.node.init) &&
        isFunctionNode(definition.node.init)),
  );
}
