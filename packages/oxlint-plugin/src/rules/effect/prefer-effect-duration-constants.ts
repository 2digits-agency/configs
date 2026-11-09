import {
  Diagnostic,
  Rule,
  RuleContext,
  Visitor,
  type CreateRule,
  type ESTree,
  type OxlintSourceCode,
} from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as HashMap from 'effect/HashMap';
import * as Opt from 'effect/Option';
import * as Order from 'effect/Order';
import * as R from 'effect/Record';
import * as Ref from 'effect/Ref';
import * as Schema from 'effect/Schema';
import * as Tuple from 'effect/Tuple';

import { isConstDeclaration, unwrapExpression, walkNodes } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { lookupVariable, resolveVariable, soleDefinition } from '../../internal/scope';
import {
  durationArgument,
  durationConstructor,
  nameWords,
  numericValue,
  timeArithmetic,
  type DurationUnit,
} from './internal/duration';

type NumericDeclarator = ESTree.VariableDeclarator & {
  readonly id: ESTree.BindingIdentifier;
  readonly init: ESTree.Expression;
};

const unitWords: Readonly<Record<string, DurationUnit>> = {
  ms: 'millis',
  milli: 'millis',
  millis: 'millis',
  millisecond: 'millis',
  milliseconds: 'millis',
  sec: 'seconds',
  secs: 'seconds',
  seconds: 'seconds',
  mins: 'minutes',
  minutes: 'minutes',
  hr: 'hours',
  hrs: 'hours',
  hours: 'hours',
  days: 'days',
  weeks: 'weeks',
};

const isSingularUnit = Schema.is(Schema.Literals(['day', 'hour', 'minute', 'second', 'week']));

// Singular units name a quantity (`ONE_DAY`), not the unit of the number, so they only mark the name as a duration.
const isDurationWord = Schema.is(
  Schema.Literals([
    'backoff',
    'cooldown',
    'day',
    'debounce',
    'delay',
    'duration',
    'expiration',
    'expiry',
    'hour',
    'interval',
    'lifetime',
    'minute',
    'second',
    'throttle',
    'timeout',
    'ttl',
    'week',
  ]),
);

// Conversion factors (`MS_PER_SECOND`, see also `SECONDS_IN_MINUTE` below), rates (`REQUESTS_PER_SECOND`), and timestamps (`CREATED_AT_MS`) are not durations.
const isNonDurationWord = Schema.is(Schema.Literals(['at', 'epoch', 'per', 'timestamp']));

/**
 * What a binding name says about its number: a unit, a duration of unknown unit, explicitly not a duration, or nothing.
 */
type NameUnit = DurationUnit | 'excluded' | 'none' | 'unknown';

const isDurationUnit = Schema.is(
  Schema.Literals(['days', 'hours', 'millis', 'minutes', 'seconds', 'weeks'] satisfies ReadonlyArray<DurationUnit>),
);

/**
 * Classify a binding name by its last word: a unit (`TIMEOUT_MS`, `ttlSeconds`) or a duration concept
 * (`REQUEST_TIMEOUT`, `ONE_DAY`, `maxAge`, `expiresIn`). Earlier words do not count, so `RETRY_DELAY_FACTOR` is not a
 * duration, except for words that mark a factor, rate, or timestamp.
 *
 * @param name Binding name.
 */
function nameUnit(name: string): NameUnit {
  const parts = nameWords(name);

  const inIndex = parts.indexOf('in');

  // `SECONDS_IN_MINUTE` converts between units; `ttlInMinutes` and `expiresIn` are still durations.
  const conversion =
    inIndex > 0 &&
    inIndex < parts.length - 1 &&
    Opt.exists(Arr.get(parts, inIndex - 1), (before) => R.has(unitWords, before) || isSingularUnit(before));

  if (conversion || Arr.some(parts, isNonDurationWord)) {
    return 'excluded';
  }

  const previous = Arr.get(parts, parts.length - 2);

  return Opt.match(Arr.last(parts), {
    onNone: (): NameUnit => 'none',
    onSome: (last) =>
      Opt.match(R.get(unitWords, last), {
        onSome: (unit): NameUnit => unit,
        onNone: () =>
          isDurationWord(last) ||
          (last === 'age' && Opt.contains(previous, 'max')) ||
          (last === 'in' && Opt.contains(previous, 'expires'))
            ? 'unknown'
            : 'none',
      }),
  });
}

function typeNamePath(node: ESTree.TSTypeName): Opt.Option<Arr.NonEmptyReadonlyArray<string>> {
  if (node.type === 'Identifier') {
    return Opt.some(Arr.of(node.name));
  }

  return node.type === 'TSQualifiedName'
    ? Opt.map(typeNamePath(node.left), (path) => Arr.append(path, node.right.name))
    : Opt.none();
}

/**
 * Whether an annotation references a type from Effect's Duration module through its import binding, such as
 * `Duration.Input`, `D.Duration` from `import type * as D from 'effect/Duration'`, or `Duration.Duration` from
 * `effect`. Local types that shadow the import, such as an inner `type Input = number`, are not Effect's.
 *
 * @param annotation Type annotation to inspect.
 * @param sourceCode Source of the file.
 * @param imports Import bindings of the file.
 */
function durationAnnotation(annotation: ESTree.Node, sourceCode: OxlintSourceCode, imports: ImportBindings): boolean {
  return walkNodes(
    annotation,
    (node) =>
      node.type === 'TSTypeReference' &&
      Opt.exists(typeNamePath(node.typeName), ([root, ...rest]) => {
        const imported = Opt.exists(lookupVariable(sourceCode, node, root), ({ defs }) =>
          Arr.some(defs, (definition) => definition.type === 'ImportBinding'),
        );

        return (
          imported &&
          Opt.exists(Opt.fromNullishOr(imports.bindings.get(root)), (path) =>
            Opt.contains(Arr.head([...path, ...rest]), 'Duration'),
          )
        );
      }),
  );
}

function isNumericDeclarator(node: ESTree.Node): node is NumericDeclarator {
  return (
    node.type === 'VariableDeclarator' &&
    isConstDeclaration(node.parent) &&
    node.id.type === 'Identifier' &&
    node.init !== null &&
    Opt.isSome(numericValue(node.init))
  );
}

/**
 * The numeric `const` declarator an expression references.
 *
 * @param node Expression passed as a duration.
 */
function declaratorOf(node: ESTree.Expression): Effect.Effect<Opt.Option<NumericDeclarator>, never, RuleContext> {
  const expression = unwrapExpression(node);

  return expression.type === 'Identifier'
    ? Effect.map(resolveVariable(expression, expression.name), (variable) =>
        Opt.filter(
          Opt.map(soleDefinition(variable), ({ node: declaration }) => declaration as ESTree.Node),
          isNumericDeclarator,
        ),
      )
    : Effect.succeedNone;
}

type Candidate = readonly [NumericDeclarator, boolean];

const bySourcePosition = Order.mapInput(Order.Number, ([offset]: readonly [number, Candidate]) => offset);

export const preferEffectDurationConstants: CreateRule = Rule.define({
  name: 'prefer-effect-duration-constants',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect Duration values over plain-number duration constants.',
    messages: {
      durationConstant:
        '{{name}} holds a duration as a plain number. Declare it as {{replacement}} and convert at non-Effect boundaries with Duration.toMillis or Duration.toSeconds.',
    },
    url: 'https://www.effect.website/docs/v4/api/effect/Duration',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    /*
     * Classify at the end of the file so forward references and declaration order do not change the suggestion. Keyed
     * by source offset, because Effect hashes plain objects such as syntax nodes structurally. The flag records whether
     * the constant is passed to an API that takes a `Duration.Input`.
     */
    const candidates = yield* Ref.make(HashMap.empty<number, Candidate>());

    /**
     * The unit to suggest for a constant: a known unit, none when the constant is not a duration, or an unknown unit.
     *
     * @param node Numeric constant.
     * @param passedAsDuration Whether an Effect duration API receives it.
     */
    function durationUnit(node: NumericDeclarator, passedAsDuration: boolean): Opt.Option<Opt.Option<DurationUnit>> {
      // `const TIMEOUT: Duration.Input = 5000` already opts into Duration.
      if (node.id.typeAnnotation && durationAnnotation(node.id.typeAnnotation, ctx.sourceCode, imports)) {
        return Opt.none();
      }

      const named = nameUnit(node.id.name);

      const namedUnit = Opt.liftPredicate(named, isDurationUnit);

      // Effect reads a plain number passed as `Duration.Input` as milliseconds.
      if (passedAsDuration) {
        return Opt.some(Opt.orElseSome(namedUnit, (): DurationUnit => 'millis'));
      }

      // Zero and negative values are usually sentinels such as "disabled" or "no timeout".
      if (named === 'excluded' || Opt.getOrElse(numericValue(node.init), () => 0) <= 0) {
        return Opt.none();
      }

      if (Opt.isSome(namedUnit)) {
        return Opt.some(namedUnit);
      }

      const arithmetic = timeArithmetic(node.init);

      if (Opt.exists(arithmetic, ({ millis }) => millis)) {
        return Opt.some(Opt.some('millis'));
      }

      return named === 'unknown' || Opt.isSome(arithmetic) ? Opt.some(Opt.none()) : Opt.none();
    }

    function reportCandidate([, [node, passedAsDuration]]: readonly [number, Candidate]) {
      return Opt.match(durationUnit(node, passedAsDuration), {
        onNone: () => Effect.void,
        onSome: (unit) =>
          ctx.report(
            Diagnostic.fromId({
              node: node.id,
              messageId: 'durationConstant',
              data: {
                name: node.id.name,
                replacement: Opt.getOrElse(
                  Opt.zipWith(numericValue(node.init), unit, durationConstructor),
                  () => 'a Duration constructor such as Duration.seconds',
                ),
              },
            }),
          ),
      });
    }

    return Visitor.merge(
      Visitor.on('VariableDeclarator', (node) =>
        imports.hasEffectImport && isNumericDeclarator(node)
          ? Ref.update(candidates, (current) =>
              HashMap.has(current, Tuple.get(node.range, 0))
                ? current
                : HashMap.set(current, Tuple.get(node.range, 0), [node, false]),
            )
          : Effect.void,
      ),
      Visitor.on('CallExpression', (node) =>
        durationArgument(node, imports).pipe(
          Effect.flatMap(
            Opt.match({
              onNone: () => Effect.succeedNone,
              onSome: declaratorOf,
            }),
          ),
          Effect.flatMap(
            Opt.match({
              onNone: () => Effect.void,
              onSome: (declarator) =>
                Ref.update(candidates, (current) =>
                  HashMap.set(current, Tuple.get(declarator.range, 0), [declarator, true]),
                ),
            }),
          ),
        ),
      ),
      Visitor.onExit('Program', () =>
        Effect.flatMap(Ref.get(candidates), (current) =>
          // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
          Effect.forEach(Arr.sort(HashMap.toEntries(current), bySourcePosition), reportCandidate, { discard: true }),
        ),
      ),
    );
  },
});
