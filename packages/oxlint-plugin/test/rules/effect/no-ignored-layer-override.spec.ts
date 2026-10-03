import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { noIgnoredLayerOverride } from '../../../src/rules/effect/no-ignored-layer-override';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

const graph = `
import { Context, Effect, Layer } from 'effect';
const Db = Context.Service('Db');
const Reader = Context.Service('Reader');
const DbProd = Layer.succeed(Db, { read: Effect.succeed('production') });
const DbMock = Layer.succeed(Db, { read: Effect.succeed('mock') });
const ReaderCore = Layer.effect(Reader, Effect.gen(function* () {
  const db = yield* Db;
  return { read: db.read };
}));
const ReaderPacked = ReaderCore.pipe(Layer.provide(DbProd));
`;

const ignored = 'ReaderPacked.pipe(Layer.provide(DbMock));';

tester.run('no-ignored-layer-override', noIgnoredLayerOverride, {
  valid: [
    `${graph} ReaderCore.pipe(Layer.provide(DbMock));`,
    `${graph} ReaderPacked.pipe(Layer.provide(DbProd));`,
    `${graph} const ProdAlias = DbProd; ReaderPacked.pipe(Layer.provide(ProdAlias));`,
    `${graph} const Other = Context.Service('Other'); ReaderPacked.pipe(Layer.provide(Layer.succeed(Other, {})));`,
    `${graph} { const Db = Context.Service('Db'); const mock = Layer.succeed(Db, {}); ReaderPacked.pipe(Layer.provide(mock)); }`,
    graph.replace('const db = yield* Db;', 'const db = { read: Effect.succeed("unused") };') + ignored,
    graph.replace('const db = yield* Db;', 'const db = { read: Effect.gen(function* () { yield* Db; }) };') + ignored,
    `${graph.replace('Layer.provide(DbProd)', 'Layer.provide(DbMock)')}ReaderCore.pipe(Layer.provide(DbProd));`,
    `${graph} import { Unknown } from './other'; Unknown.pipe(Layer.provide(DbMock));`,
    `${graph.replace('Layer.provide(DbProd)', 'Layer.provide(Unknown)')}import { Unknown } from './other'; ${ignored}`,
    `${graph} ReaderPacked.pipe(Layer.provide([DbMock, Unknown]));`,
    `${graph} const providers = [DbMock]; ReaderPacked.pipe(Layer.provide(providers));`,
    graph.replace('const ReaderPacked', 'let ReaderPacked') + ignored,
    graph.replace('const DbMock', 'let DbMock') + ignored,
    `${graph.replace('yield* Db', 'yield* Alias')}let Alias = Db; ${ignored}`,
    `${graph} const mock = DbMock; mock = unknown; ReaderPacked.pipe(Layer.provide(mock));`,
    `${graph} const a = b; const b = a; a.pipe(Layer.provide(DbMock));`,
    `${graph} function f(Layer) { ${ignored} }`,
    graph.replace('const Db = Context.Service', 'const Db = makeTag') + ignored,
    `${graph} ReaderPacked.Default.pipe(Layer.provide(DbMock));`,
    graph.replace('Layer.provide(DbProd)', 'Layer.merge(DbProd, Unknown)') + ignored,
    graph.replace('const db = yield* Db;', 'return {}; const db = yield* Db;') + ignored,
    `${graph} DbMock.build = unknown; ${ignored}`,
    `${graph} const Alias = Db; Alias.key = 'changed'; ${ignored}`,
    `${graph} const Alias = Db as typeof Db; Alias.key = 'changed'; ${ignored}`,
    `${graph} ({ key: Db.key } = { key: 'changed' }); ${ignored}`,
    `${graph} const Alias = DbMock satisfies Layer.Layer<Db>; delete Alias.build; ${ignored}`,
    `${graph} [DbMock.build] = [unknown]; ${ignored}`,
    graph.replace('Layer.provide(DbProd)', 'Layer.provide(Layer.succeed(Reader, {}))') + ignored,
    `${graph} import { ImportedTag } from './other'; const mock = Layer.succeed(ImportedTag, {}); ReaderPacked.pipe(Layer.provide(mock));`,
    graph.replace("Context.Service('Db')", 'Context.Service(dynamicKey)') + ignored,
    graph.replace('function* ()', 'async function* ()') + ignored,
    graph.replace('const db = yield* Db;', 'if (enabled) { yield* Db; } const db = {};') + ignored,
    `${graph} function f(Effect) { const Open = Layer.effect(Reader, Effect.gen(function* () { yield* Db; })); const Packed = Open.pipe(Layer.provide(DbProd)); Packed.pipe(Layer.provide(DbMock)); }`,
  ],
  invalid: [
    {
      code: `${graph} ReaderPacked.pipe(Layer.provide(DbMock));`,
      errors: [
        {
          messageId: 'ignoredOverride',
          data: { tag: 'Db', packed: 'ReaderPacked', open: 'ReaderCore' },
          line: 12,
          column: 19,
        },
      ],
    },
    ...[
      `${graph.replace('yield* Db', 'yield* Alias')}const Alias = Db; ${ignored}`,
      graph.replace(
        "import { Context, Effect, Layer } from 'effect';",
        `import * as Context from 'effect/Context'; import * as Effect from 'effect/Effect'; import * as Layer from 'effect/Layer';`,
      ) + ignored,
      `${graph
        .replace(
          "import { Context, Effect, Layer } from 'effect';",
          `import { Service } from 'effect/Context'; import { gen } from 'effect/Effect'; import { effect, succeed, provide } from 'effect/Layer';`,
        )
        .replaceAll('Context.Service', 'Service')
        .replaceAll('Effect.gen', 'gen')
        .replaceAll('Layer.effect', 'effect')
        .replaceAll('Layer.succeed', 'succeed')
        .replaceAll('Layer.provide', 'provide')}ReaderPacked.pipe(provide(DbMock));`,
      `${graph} const mockAlias = DbMock; const packedAlias = ReaderPacked; packedAlias.pipe(Layer.provide(mockAlias));`,
      `${graph.replace(
        'ReaderCore.pipe(Layer.provide(DbProd))',
        'Layer.provide(ReaderCore, DbProd)',
      )}Layer.provide(ReaderPacked, DbMock);`,
      `${graph} ReaderCore.pipe(Layer.provide(DbProd), Layer.provide(DbMock));`,
      `${graph} const keys = {}; keys[Db.key] = 1; ${ignored}`,
      `${graph} let value; ({ value = Db.key } = {}); ${ignored}`,
      graph.replace("const Db = Context.Service('Db');", "class Db extends Context.Service<Db, {}>()('Db') {}") +
        ignored,
      graph
        .replaceAll('Effect', 'Fx')
        .replaceAll('Layer', 'L')
        .replace('{ Context, Fx, L }', '{ Context, Effect as Fx, Layer as L }') + ignored.replaceAll('Layer', 'L'),
    ].map((code) => ({ code, errors: [{ messageId: 'ignoredOverride' }] })),
  ],
});
