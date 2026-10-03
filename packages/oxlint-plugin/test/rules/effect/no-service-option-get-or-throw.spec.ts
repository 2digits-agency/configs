/* eslint-disable unicorn/no-null -- RuleTester uses null to assert that no automatic fix is emitted. */
import { RuleTester } from 'oxlint/plugins-dev';

import { noServiceOptionGetOrThrow } from '../../../src/rules/effect/no-service-option-get-or-throw';
import { testRule } from '../../rule-tester';

testRule('no-service-option-get-or-throw', noServiceOptionGetOrThrow, {
  valid: `
    import * as Fx from 'effect/Effect'
    import * as Option from 'effect/Option'
    Fx.serviceOption(Logger).pipe(Fx.map(Option.getOrElse(() => fallback)))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    import * as Option from 'effect/Option'
    Fx.gen(function* () {
      const logger = Option.getOrThrow(yield* Fx.serviceOption(Logger))
      return logger
    })
  `,
  messageId: 'getOrThrow',
});

testRule('no-service-option-get-or-throw', noServiceOptionGetOrThrow, {
  valid: `
    import * as Fx from 'effect/Effect'
    import * as Opt from 'effect/Option'
    Fx.gen(function* () {
      const logger = yield* Fx.serviceOption(Logger)
      return Opt.getOrUndefined(logger)
    })
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    import * as Opt from 'effect/Option'
    Fx.gen(function* () {
      const logger = yield* Fx.serviceOption(Logger)
      return Opt.getOrThrow(logger)
    })
  `,
  messageId: 'getOrThrow',
  output: null,
});

const imports = `
  import * as Fx from 'effect/Effect'
  import * as Opt from 'effect/Option'
`;

function program(body: string): string {
  return `${imports} Fx.gen(function* () { ${body} })`;
}

const tester = new RuleTester({
  languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' },
});

tester.run('no-service-option-get-or-throw: adjacent immutable bindings', noServiceOptionGetOrThrow, {
  valid: [
    // Optional consumers, transformations, and escapes are not required acquisitions.
    ...[
      'return Opt.getOrElse(logger, () => fallback)',
      'return Opt.match(logger, { onNone: () => fallback, onSome: use })',
      'return Opt.map(logger, use)',
      'return forward(logger)',
      'return logger',
      'cache.logger = logger',
      'return Opt.isSome(logger) ? Opt.getOrThrow(logger) : fallback',
      'if (Opt.isNone(logger)) return fallback; return Opt.getOrThrow(logger)',
      'if (Opt.isSome(logger)) return Opt.getOrThrow(logger)',
      'if (enabled) return Opt.getOrThrow(logger)',
      'return enabled && Opt.getOrThrow(logger)',
      'return (() => Opt.getOrThrow(logger))()',
      'return consume(Opt.getOrThrow(logger))',
      'return (intervening(), Opt.getOrThrow(logger))',
      'intervening(); return Opt.getOrThrow(logger)',
      'const other = 1; return Opt.getOrThrow(logger)',
      'return Opt.getOrThrow(Opt.map(logger, use))',
      'const result = Opt.getOrThrow(logger); use(logger); return result',
      'const result = Opt.getOrThrow(logger); const later = () => logger; return result',
      'logger = replacement; return Opt.getOrThrow(logger)',
      'return Opt.getOrThrow?.(logger)',
      '{ const logger = otherOption; return Opt.getOrThrow(logger) }',
      '{ const logger = otherOption; use(logger) } return Opt.getOrThrow(logger)',
      'const result = Opt.getOrThrow(logger), later = use(logger)',
    ].map((consumer) => program(`const logger = yield* Fx.serviceOption(Logger); ${consumer}`)),
    program('let logger = yield* Fx.serviceOption(Logger); return Opt.getOrThrow(logger)'),
    program('let logger = yield* Fx.serviceOption(Logger); logger = other; return Opt.getOrThrow(logger)'),
    program('const { logger } = yield* Fx.serviceOption(Logger); return Opt.getOrThrow(logger)'),
    program('const logger = yield Fx.serviceOption(Logger); return Opt.getOrThrow(logger)'),
    program('const logger = yield* Fx.serviceOption(Logger), other = intervene(); return Opt.getOrThrow(logger)'),
    program('const logger = yield* Fx.serviceOption(Logger); return Opt.getOrThrow(other)'),
    `${imports} function* standalone() {
      const logger = yield* Fx.serviceOption(Logger); return Opt.getOrThrow(logger)
    } Fx.gen(standalone)`,
    `${imports} other.gen(function* () {
      const logger = yield* Fx.serviceOption(Logger); return Opt.getOrThrow(logger)
    })`,
    `${imports} function run(Fx) { return Fx.gen(function* () {
      const logger = yield* Fx.serviceOption(Logger); return Opt.getOrThrow(logger)
    }) }`,
    `${imports} function run(Opt) { return Fx.gen(function* () {
      const logger = yield* Fx.serviceOption(Logger); return Opt.getOrThrow(logger)
    }) }`,
    `${imports} Fx.gen(function* () {
      const Opt = { getOrThrow: (value) => value }
      const logger = yield* Fx.serviceOption(Logger); return Opt.getOrThrow(logger)
    })`,
    `import { gen as generate, serviceOption as optional } from 'effect/Effect'
     import { getOrThrow as unwrap } from 'effect/Option'
     function run(unwrap) { return generate(function* () {
       const logger = yield* optional(Logger); return unwrap(logger)
     }) }`,
    `import { gen as generate, serviceOption as optional } from 'effect/Effect'
     import { getOrThrow as unwrap } from 'effect/Option'
     function run(optional) { return generate(function* () {
       const logger = yield* optional(Logger); return unwrap(logger)
     }) }`,
    `${imports} function run(Opt) { return Opt.getOrThrow(yielded) }`,
    `${imports} function run(Fx) { return Fx.serviceOption(Logger).pipe(Fx.map(Opt.getOrThrow)) }`,
    `${imports} function run(Opt) { return Fx.serviceOption(Logger).pipe(Fx.map(Opt.getOrThrow)) }`,
    `import * as Fx from 'effect/Effect'
     const Option = { getOrThrow: (value) => value }
     Fx.gen(function* () { return Option.getOrThrow(yield* Fx.serviceOption(Logger)) })`,
  ].map((code) => ({ code, filename: 'optional.ts' })),
  invalid: [
    program('const logger = yield* Fx.serviceOption(Logger); Opt.getOrThrow(logger)'),
    program('const logger = yield* Fx.serviceOption(Logger); const result = Opt.getOrThrow(logger); return result'),
    program('const logger = yield* Fx.serviceOption(Logger); return Opt.getOrThrowWith(logger, () => customError)'),
    program('const logger = yield* Fx.serviceOption(Logger); /* comment */ ; return Opt.getOrThrow(logger)'),
    `import { Effect as Fx, Option as Opt } from 'effect'
     Fx.gen(function* () {
       const logger = yield* Fx.serviceOption(Logger); return Opt.getOrThrowWith(logger, () => customError)
     })`,
    `import { gen as generate, serviceOption as optional } from 'effect/Effect'
     import { getOrThrow as unwrap } from 'effect/Option'
     generate(function* () { const logger = yield* optional(Logger); return unwrap(logger) })`,
    `import { gen as generate, serviceOption as optional } from 'effect/Effect'
     import { getOrThrowWith as unwrapWith } from 'effect/Option'
     generate(function* () {
       const logger = yield* optional(Logger); return unwrapWith(logger, () => customError)
     })`,
    program('const logger = Opt.getOrThrowWith(yield* Fx.serviceOption(Logger), () => customError); return logger'),
    `${imports} Fx.serviceOption(Logger).pipe(Fx.map(Opt.getOrThrow))`,
    `${imports} Fx.serviceOption(Logger).pipe(Fx.map(Opt.getOrThrowWith))`,
  ].map((code) => ({ code, filename: 'required.ts', errors: [{ messageId: 'getOrThrow' }], output: null })),
});
