import * as Arr from 'effect/Array';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

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
