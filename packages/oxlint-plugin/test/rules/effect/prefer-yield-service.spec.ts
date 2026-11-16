import { describe, it } from '@effect/vitest';
import * as Arr from 'effect/Array';
import { RuleTester } from 'oxlint/plugins-dev';

import { rules } from '../../../src';

RuleTester.describe = describe;

RuleTester.it = it;

RuleTester.itOnly = it.only;

const imports = `
  import * as Effect from 'effect/Effect'
  import * as Layer from 'effect/Layer'
`;

new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } }).run(
  'prefer-yield-service',
  rules['prefer-yield-service'],
  {
    valid: Arr.map(
      [
        `${imports}
        Effect.gen(function* () {
          const fs = yield* FileSystem
          return { read: (path: string) => fs.read(path) }
        })`,
        // A runtime bridge for callbacks keeps the context but never provides it back.
        `${imports}
        Effect.gen(function* () {
          const context = yield* Effect.context<Store>()
          return { onMessage: (message: Message) => Effect.runForkWith(context)(handle(message)) }
        })`,
        `${imports}
        Effect.gen(function* () {
          const services = yield* Effect.context<Store>()
          return { store: Context.get(services, Store) }
        })`,
        // Providing something other than the captured context, or passing the context to an unrelated call.
        `${imports}
        Effect.gen(function* () {
          const services = yield* Effect.context<Store>()
          return { run: work.pipe(Effect.provide(Store.layer)), other: register(Effect.provide, services) }
        })`,
        // A parameter that shadows the captured context.
        `${imports}
        Effect.gen(function* () {
          const services = yield* Effect.context<Store>()
          return (services: Context.Context<Store>) => work.pipe(Effect.provide(services))
        })`,
        // Not Effect's Effect.
        `
        import * as Effect from 'other-library'
        Effect.gen(function* () {
          const services = yield* Effect.context()
          return work.pipe(Effect.provide(services))
        })`,
      ],
      (code) => ({ code, filename: 'valid.ts' }),
    ),
    invalid: Arr.map(
      [
        [
          `${imports}
          Effect.gen(function* () {
            const fileAccess = yield* Effect.context<FileSystem | Path>()
            return { build: (dir: string) => runBuild(dir).pipe(Effect.provideContext(fileAccess)) }
          })`,
          'Effect.provideContext',
        ],
        [
          `${imports}
          Effect.gen(function* () {
            const services = yield* Effect.context<Store | Crypto>()
            return { process: Effect.provide(process, services) }
          })`,
          'Effect.provide',
        ],
        [
          `
          import { Effect, Layer } from 'effect'
          Layer.unwrap(Effect.gen(function* () {
            const context = yield* Effect.context<Store>()
            return Live.pipe(Layer.provide((context as never)))
          }))`,
          'Layer.provide',
        ],
        [
          `${imports}
          Layer.unwrap(Effect.gen(function* () {
            const context = yield* Effect.context<Store>()
            return Live.pipe(Layer.provide(Layer.succeedContext(context)))
          }))`,
          'Layer.succeedContext',
        ],
        [
          `
          import { context, provide } from 'effect/Effect'
          gen(function* () {
            const services = yield* context<Store>()
            return work.pipe(provide(services))
          })`,
          'provide',
        ],
      ] as const,
      ([code, provide]) => ({
        code,
        filename: 'invalid.ts',
        errors: [{ messageId: 'reprovidedContext', data: { provide } }],
      }),
    ),
  },
);
