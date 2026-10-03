import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

const Db = Context.Service('Db');
const Reader = Context.Service('Reader');
const DbProd = Layer.succeed(Db, { read: Effect.succeed('production') });
const DbMock = Layer.succeed(Db, { read: Effect.succeed('mock') });
const ReaderCore = Layer.effect(Reader, Effect.gen(function* () {
  const db = yield* Db;
  return { read: db.read };
}));
const ReaderPacked = ReaderCore.pipe(Layer.provide(DbProd));

ReaderPacked.pipe(Layer.provide(DbMock));
