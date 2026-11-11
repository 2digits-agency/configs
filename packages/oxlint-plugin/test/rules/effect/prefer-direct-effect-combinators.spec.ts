/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
import { describe, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { preferDirectEffectCombinators } from '../../../src/rules/effect/prefer-direct-effect-combinators';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

const opt = `import * as Opt from 'effect/Option';`;

const arr = `import * as Arr from 'effect/Array'; import * as Opt from 'effect/Option';`;

const result = `import * as Result from 'effect/Result'; import * as Opt from 'effect/Option';`;

const fn = `import { flow, pipe } from 'effect/Function';`;

type Expected = readonly [code: string, messageId: string, output: string | null];

/**
 * Cases whose fix is an autofix, or none (`null`).
 */
const fixes: ReadonlyArray<Expected> = [
  // Option
  [`${opt} Opt.filter(Opt.some(x), p)`, 'pair', `${opt} Opt.liftPredicate(x, p)`],
  [`${opt} Opt.some(x).pipe(Opt.filter(p))`, 'pair', `${opt} Opt.liftPredicate(x, p)`],
  [`${opt} Opt.some(x).pipe(Opt.filter(p), Opt.map(f))`, 'pair', `${opt} Opt.liftPredicate(x, p).pipe(Opt.map(f))`],
  [`${opt} ${fn} pipe(x, Opt.some, Opt.filter(p))`, 'pair', `${opt} ${fn} pipe(x, Opt.liftPredicate(p))`],
  [`${opt} Opt.isSome(Opt.filter(o, p))`, 'pair', `${opt} Opt.exists(o, p)`],
  [`${opt} o.pipe(Opt.filter(p), Opt.isSome)`, 'pair', `${opt} o.pipe(Opt.exists(p))`],
  [`${opt} ${fn} pipe(o, Opt.filter(p), Opt.isSome)`, 'pair', `${opt} ${fn} pipe(o, Opt.exists(p))`],
  [`${opt} Opt.isNone(Opt.filter(o, p))`, 'pair', `${opt} !Opt.exists(o, p)`],
  [`${opt} String(Opt.isNone(Opt.filter(o, p)).valueOf())`, 'pair', `${opt} String((!Opt.exists(o, p)).valueOf())`],
  [`${opt} if (o.pipe(Opt.filter(p), Opt.isNone)) {}`, 'pair', `${opt} if (!o.pipe(Opt.exists(p))) {}`],
  // The negation cannot wrap a step in the middle of a pipe.
  [`${opt} o.pipe(Opt.filter(p), Opt.isNone, String)`, 'pair', null],
  [`${opt} Opt.flatten(Opt.map(o, f))`, 'pair', `${opt} Opt.flatMap(o, f)`],
  [`${opt} o.pipe(Opt.map(f), Opt.flatten)`, 'pair', `${opt} o.pipe(Opt.flatMap(f))`],
  [`${opt} Opt.getOrElse(Opt.map(o, f), () => d)`, 'pair', `${opt} Opt.match(o, { onSome: f, onNone: () => d })`],
  [
    `${opt} o.pipe(Opt.map(f), Opt.getOrElse(() => d))`,
    'pair',
    `${opt} o.pipe(Opt.match({ onSome: f, onNone: () => d }))`,
  ],
  [`${opt} Opt.getOrElse(Opt.map(o, (x) => x > 1), () => false)`, 'pair', `${opt} Opt.exists(o, (x) => x > 1)`],
  [`${opt} Opt.flatMap(o, (x) => Opt.fromNullishOr(f(x)))`, 'callback', `${opt} Opt.flatMapNullishOr(o, (x) => f(x))`],
  [
    `${opt} o.pipe(Opt.flatMap((x) => { return Opt.fromNullishOr(x.parent) }))`,
    'callback',
    `${opt} o.pipe(Opt.flatMapNullishOr((x) => { return x.parent }))`,
  ],
  [`${opt} Opt.flatMap(o, (x) => Opt.some({ x }))`, 'callback', `${opt} Opt.map(o, (x) => ({ x }))`],
  [`${opt} Opt.orElse(o, () => Opt.some(d))`, 'callback', `${opt} Opt.orElseSome(o, () => d)`],
  [`${opt} Opt.getOrElse(o, () => null)`, 'callback', `${opt} Opt.getOrNull(o)`],
  [`${opt} o.pipe(Opt.getOrElse(() => undefined))`, 'callback', `${opt} o.pipe(Opt.getOrUndefined)`],
  [
    `${opt} Opt.match(o, { onNone: () => false, onSome: (x) => x > 1 })`,
    'callback',
    `${opt} Opt.exists(o, (x) => x > 1)`,
  ],
  [`${opt} Opt.isSome(Opt.filter(o, /* keep */ p))`, 'pair', null],
  // Aliases
  [
    `import { Option as O } from 'effect'; O.isSome(O.filter(o, p))`,
    'pair',
    `import { Option as O } from 'effect'; O.exists(o, p)`,
  ],
  [
    `import { filter, isSome } from 'effect/Option'; isSome(filter(o, p))`,
    'pair',
    `import * as Opt from 'effect/Option';\nimport { filter, isSome } from 'effect/Option'; Opt.exists(o, p)`,
  ],
  // Array
  [`${arr} Opt.isSome(Arr.findFirst(xs, (x) => x.id === id))`, 'pair', `${arr} Arr.some(xs, (x) => x.id === id)`],
  [
    `${arr} import * as P from 'effect/Predicate'; Arr.findFirst(xs, P.isString).pipe(Opt.isNone)`,
    'pair',
    `${arr} import * as P from 'effect/Predicate'; !Arr.some(xs, P.isString)`,
  ],
  [`${arr} Opt.isSome(Arr.findFirstIndex(xs, p))`, 'pair', `${arr} Arr.some(xs, p)`],
  [`${arr} Arr.flatten(Arr.map(xs, f))`, 'pair', `${arr} Arr.flatMap(xs, f)`],
  [`${arr} ${fn} flow(Arr.map(f), Arr.flatten)`, 'pair', `${arr} ${fn} flow(Arr.flatMap(f))`],
  [`${arr} Arr.map(Arr.filter(xs, Opt.isSome), (o) => o.value)`, 'pair', `${arr} Arr.getSomes(xs)`],
  [
    `${arr} import * as Result from 'effect/Result'; ${fn} pipe(xs, Arr.filter(Result.isSuccess), Arr.map(Result.getOrThrow))`,
    'pair',
    `${arr} import * as Result from 'effect/Result'; ${fn} pipe(xs, Arr.getSuccesses)`,
  ],
  [
    `${arr} import * as P from 'effect/Predicate'; Arr.filter(Arr.map(xs, (x) => x.parent), P.isNotNullish)`,
    'pair',
    `${arr} import * as P from 'effect/Predicate'; Arr.flatMapNullishOr(xs, (x) => x.parent)`,
  ],
  // `Arr.map` passes an index that `Arr.flatMapNullishOr` does not.
  [`${arr} import * as P from 'effect/Predicate'; Arr.filter(Arr.map(xs, f), P.isNotNullish)`, 'pair', null],
  [
    `${arr} Arr.flatMap(xs, (x) => Arr.fromNullishOr(x.parent))`,
    'callback',
    `${arr} Arr.flatMapNullishOr(xs, (x) => x.parent)`,
  ],
  [`${arr} Arr.length(Arr.filter(xs, p))`, 'pair', `${arr} Arr.countBy(xs, p)`],
  [`${arr} Opt.isSome(Arr.head(xs))`, 'pair', `${arr} Arr.isReadonlyArrayNonEmpty(xs)`],
  [`${arr} Arr.last(xs).pipe(Opt.isNone)`, 'pair', `${arr} Arr.isReadonlyArrayEmpty(xs)`],
  [`${arr} Arr.head(Arr.reverse(xs))`, 'pair', `${arr} Arr.last(xs)`],
  // Result
  [
    `${result} Result.getOrElse(Result.map(r, f), g)`,
    'pair',
    `${result} Result.match(r, { onSuccess: f, onFailure: g })`,
  ],
  [
    `${result} r.pipe(Result.mapError(g), Result.map(f))`,
    'pair',
    `${result} r.pipe(Result.mapBoth({ onFailure: g, onSuccess: f }))`,
  ],
  [
    `${result} Result.mapError(Result.map(r, f), g)`,
    'pair',
    `${result} Result.mapBoth(r, { onSuccess: f, onFailure: g })`,
  ],
  [`${result} Result.flatMap(r, (x) => Result.succeed(x + 1))`, 'callback', `${result} Result.map(r, (x) => x + 1)`],
  [`${result} Result.getOrElse(r, () => null)`, 'callback', `${result} Result.getOrNull(r)`],
  [
    `${result} import * as Fn from 'effect/Function'; r.pipe(Result.getOrElse(Fn.constUndefined))`,
    'callback',
    `${result} import * as Fn from 'effect/Function'; r.pipe(Result.getOrUndefined)`,
  ],
  [`${result} Opt.isSome(Result.getSuccess(r))`, 'pair', `${result} Result.isSuccess(r)`],
  [
    `${opt} Opt.getSuccess(r).pipe(Opt.isNone)`,
    'pair',
    `import * as Result from 'effect/Result';\n${opt} Result.isFailure(r)`,
  ],
  [`${result} Result.getFailure(r).pipe(Opt.isSome)`, 'pair', `${result} Result.isFailure(r)`],
  [`${result} Opt.getOrElse(Result.getSuccess(r), () => 0)`, 'pair', `${result} Result.getOrElse(r, () => 0)`],
  // `Result.getOrElse` would pass the failure to `fallback`.
  [`${result} Opt.getOrElse(Result.getSuccess(r), fallback)`, 'pair', null],
  [`${result} Opt.getOrNull(Result.getSuccess(r))`, 'pair', `${result} Result.getOrNull(r)`],
  // Filter
  [
    `${result} import * as Filter from 'effect/Filter'; xs.filter((x) => Result.isSuccess(Filter.string(x)))`,
    'filterCheck',
    `${result} import * as Filter from 'effect/Filter'; xs.filter(Filter.toPredicate(Filter.string))`,
  ],
  [
    `${result} const parse = make(); const parsed = (x) => parse(x).pipe(Result.getSuccess)`,
    'filterCheck',
    `import * as Filter from 'effect/Filter';\n${result} const parse = make(); const parsed = Filter.toOption(parse)`,
  ],
  // `parse` is not initialized yet where `Filter.toOption(parse)` would read it.
  [`${result} const parsed = (x) => Result.getSuccess(parse(x)); const parse = make()`, 'filterCheck', null],
  // `Filter.toPredicate(rules.check)` would lose `this`.
  [`${result} const valid = (x) => Result.isSuccess(rules.check(x))`, 'filterCheck', null],
  [
    `${opt} import * as Filter from 'effect/Filter'; Opt.flatMap(o, Filter.toOption(f))`,
    'callback',
    `${opt} import * as Filter from 'effect/Filter'; Opt.filterMap(o, f)`,
  ],
];

/**
 * Cases offered as a suggestion: the code, the suggestion's output, and the report's messageId.
 */
const suggestions: ReadonlyArray<Expected> = [
  [`${arr} Arr.head(Arr.filter(xs, p))`, 'pairIfPure', `${arr} Arr.findFirst(xs, p)`],
  [`${arr} ${fn} pipe(xs, Arr.filter(p), Arr.head)`, 'pairIfPure', `${arr} ${fn} pipe(xs, Arr.findFirst(p))`],
  [`${arr} ${fn} flow(Arr.filter(p), Arr.head)`, 'pairIfPure', `${arr} ${fn} flow(Arr.findFirst(p))`],
  [`${arr} Arr.isReadonlyArrayNonEmpty(Arr.filter(xs, p))`, 'pairIfPure', `${arr} Arr.some(xs, p)`],
  [`${arr} Arr.isArrayEmpty(Arr.filter(xs, p))`, 'pairIfPure', `${arr} !Arr.some(xs, p)`],
  [`${arr} Opt.isSome(Arr.findFirst(xs, isActive))`, 'pairIfBoolean', `${arr} Arr.some(xs, isActive)`],
  [
    `${result} const valid = (x: string): boolean => Result.isSuccess(check(x))`,
    'filterCheck',
    `import * as Filter from 'effect/Filter';\n${result} const valid = Filter.toPredicate(check)`,
  ],
];

tester.run('prefer-direct-effect-combinators', preferDirectEffectCombinators, {
  valid: [
    `${opt} Opt.filter(o, p).pipe(Opt.map(f))`,
    `${opt} Opt.getOrElse(o, () => 0)`,
    `${opt} Opt.flatMap(o, (x) => Opt.fromNullishOr(f(x)) as Opt.Option<X>)`,
    `${opt} Opt.match(o, { onNone: () => true, onSome: p })`,
    `${opt} Opt.flatMap(o, (x): Opt.Option<number> => Opt.some(x))`,
    `${opt} Opt.isSome(Opt.filter<number>(o, p))`,
    // `Arr.findFirst` with an Option-returning callback finds the first Some, which `Arr.some` cannot express.
    `${arr} Opt.isSome(Arr.findFirst(xs, (x) => Opt.fromNullishOr(x.parent)))`,
    `${arr} Arr.map(Arr.filter(xs, Opt.isSome), (o) => o.value.name)`,
    `${arr} Arr.map(Arr.filter(xs, p), f)`,
    `${result} const valid = (x) => Result.isSuccess(check(x, 1))`,
    `${result} const valid = (x) => Result.isSuccess(make(x)(x))`,
    // Not Effect imports.
    `import * as Opt from './option'; Opt.isSome(Opt.filter(o, p))`,
    `Opt.isSome(Opt.filter(o, p))`,
  ],
  invalid: [
    ...Arr.map(fixes, ([code, messageId, output]) => ({ code, output, errors: [{ messageId }] })),
    ...Arr.map(suggestions, ([code, messageId, output]) => ({
      code,
      output: null,
      errors: [{ messageId, suggestions: [{ messageId: 'replace', output: output ?? '' }] }],
    })),
  ],
});
