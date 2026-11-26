import { rules } from '../../../src';
import { testRule } from '../../rule-tester';

const name = 'no-ordie-in-service-construction';

const rule = rules[name];

const imports = `import { Context, Effect, Layer } from 'effect';\n`;

const valid = `${imports}
  // Operations of the returned service and effects make defines without yielding run later.
  export class Store extends Context.Service<Store, StoreShape>()('@app/Store', {
    make: Effect.gen(function* () {
      const sql = yield* Sql;
      const find = Effect.fn('Store.find')(function* (id: string) {
        return yield* sql.find(id).pipe(Effect.orDie);
      });
      const unwrap = Effect.fnUntraced(function* (id: string) { return id; }, Effect.orDie);
      const collect = Stream.runCollect(entries).pipe(Effect.orDie);
      function remove(id: string) {
        return sql.remove(id).pipe(Effect.orDie);
      }
      return {
        find,
        unwrap,
        collect,
        remove,
        get: (id: string) => Effect.gen(function* () { return yield* sql.find(id).pipe(Effect.orDie); }),
        list: Effect.orDie(sql.list),
        stored: yield* Effect.succeed({ list: Effect.orDie(sql.list) }),
      };
    }),
  }) {
    static readonly layer = Layer.effect(this, this.make);
  }

  // Not a service class.
  class Helper {
    static make = Effect.gen(function* () { yield* risky.pipe(Effect.orDie); });
  }

  const program = Effect.gen(function* () { yield* risky.pipe(Effect.orDie); });
  const run = risky.pipe(Effect.orDie, Effect.map(toStore));
  const other = risky.pipe(Effect.orDie, (effect) => Layer.effect(Store, loadStore));
  // Effect.succeed holds an effect as a value without running it.
  const held = Layer.effect(Store, Effect.all({ deferred: Effect.succeed(load.pipe(Effect.orDie)) }));
  const value = Layer.effect(Store, Effect.succeed({ deferred: load.pipe(Effect.orDie) }));
`;

for (const invalid of [
  // The make option, with namespace imports.
  `
    import * as Context from 'effect/Context';
    import * as Effect from 'effect/Effect';
    export class Client extends Context.Service<Client, ClientShape>()('@app/Client', {
      make: Effect.gen(function* () {
        const token = yield* Config.string('TOKEN').pipe(Effect.orDie);
        return { token };
      }),
    }) {}
  `,
  `${imports}
    export class Client extends Context.Service<Client, ClientShape>()('@app/Client', {
      make: Effect.gen(function* () { return {}; }).pipe(Effect.orDie),
    }) {}
  `,
  // A yielded property value runs while make builds the service.
  `${imports}
    export class Client extends Context.Service<Client, ClientShape>()('@app/Client', {
      make: Effect.gen(function* () {
        return { token: yield* loadToken.pipe(Effect.orDie) };
      }),
    }) {}
  `,
  // Effect.all runs the properties of its object, whether yielded or passed to a Layer constructor.
  `${imports}
    export class Client extends Context.Service<Client, ClientShape>()('@app/Client', {
      make: Effect.gen(function* () {
        const { token } = yield* Effect.all({ token: loadToken.pipe(Effect.orDie) });
        return { token };
      }),
    }) {}
  `,
  `${imports}export const live = Layer.effect(Store, Effect.all({ key: loadKey.pipe(Effect.orDie) }));`,
  // A yield* inside an Effect.succeed argument runs before Effect.succeed holds its result.
  `${imports}export const live = Layer.effect(Store, Effect.gen(function* () {
    return yield* Effect.succeed(yield* load.pipe(Effect.orDie));
  }));`,
  `${imports}export const live = Layer.effect(
    Store,
    Effect.all(({ key: loadKey.pipe(Effect.orDie) }) satisfies Record<string, unknown>),
  );`,
  // A static make and a static layer method.
  `${imports}
    export class Database extends Context.Service<Database, DatabaseShape>()('@app/Database') {
      static readonly make = (file: string) => Effect.gen(function* () {
        yield* migrate(file).pipe(Effect.orDie);
        return {};
      });
    }
  `,
  `${imports}
    export class Database extends Context.Service<Database, DatabaseShape>()('@app/Database') {
      static layerFile(file: string) {
        return open(file).pipe(Effect.orDie, Effect.map((db) => Context.make(Database, db)), Layer.effectContext);
      }
    }
  `,
  // Layer constructors, through suspend and the curried Layer.effect.
  `${imports}
    export const live = Layer.effect(Store, Effect.gen(function* () {
      const key = yield* Effect.suspend(() => loadKey.pipe(Effect.orDie));
      return { key };
    }));
  `,
  `${imports}
    export const live = Layer.effect(Store)(Effect.gen(function* () {
      return { key: yield* loadKey.pipe(Effect.orDie) };
    }));
  `,
  // Pipelines into a Layer constructor.
  `${imports}export const live = loadStore.pipe(Effect.orDie, Layer.effect(Store));`,
  `${imports}export const live = loadStore.pipe(Effect.orDie).pipe(Layer.effect(Store));`,
  `${imports}export const live = loadStore.pipe(Effect.orDie, (store) => Layer.effect(Store, store));`,
  `${imports}export const live = loadStore.pipe(Effect.orDie, (store) => {
    return Layer.effect(Store)(store);
  });`,
  `
    import { pipe } from 'effect/Function';
    import * as Effect from 'effect/Effect';
    import * as Layer from 'effect/Layer';
    export const live = pipe(loadLayer, Effect.orDie, Layer.unwrap);
  `,
  `${imports}
    export const live = Layer.unwrap(Effect.gen(function* () {
      const config = yield* loadConfig.pipe(Effect.orDie);
      return Layer.succeed(Store, config);
    }));
  `,
]) {
  testRule(name, rule, { valid, invalid, messageId: 'constructionOrDie' });
}

testRule(name, rule, {
  valid: `${imports}const layer = Store.layer.pipe(Layer.orDie);`,
  validFilename: 'store.test.ts',
  invalid: `${imports}const logLayer = layerJsonl(path).pipe(Layer.orDie);`,
  messageId: 'layerOrDie',
});

// Named imports, aliased or not; the specifiers themselves and a shadowing local are not reports.
for (const [invalid, messageId] of [
  [
    `
      import { effect } from 'effect/Layer';
      import { orDie as die } from 'effect/Effect';
      export const live = effect(Store, die(loadStore));
    `,
    'constructionOrDie',
  ],
  [
    `
      import { orDie } from 'effect/Effect';
      import { Layer } from 'effect';
      export const live = Layer.effect(Store, loadStore.pipe(orDie));
    `,
    'constructionOrDie',
  ],
  [
    `
      import { orDie } from 'effect/Layer';
      const live = orDie(Store.layer);
    `,
    'layerOrDie',
  ],
] as const) {
  testRule(name, rule, {
    valid: `
      import { orDie } from 'effect/Effect';
      import { orDie as dieLayer } from 'effect/Layer';
      import * as Layer from 'effect/Layer';
      export { dieLayer };
      const program = risky.pipe(orDie);
      export const live = Layer.effect(Store, Effect.gen(function* () {
        const orDie = (effect: unknown) => effect;
        return yield* orDie(loadStore);
      }));
    `,
    invalid,
    messageId,
  });
}

// Property and method names are not reads of the import.
testRule(name, rule, {
  valid: `
    import { orDie } from 'effect/Layer';
    class Logger { orDie() {} static orDie = 1; }
    const keys = { orDie: true };
    type Keys = { orDie: string };
  `,
  invalid: `
    import { orDie } from 'effect/Layer';
    const live = Store.layer.pipe(orDie);
  `,
  messageId: 'layerOrDie',
});

testRule(name, rule, {
  valid: `
    import * as Layer from 'other-library';
    const layer = live.pipe(Layer.orDie);
  `,
  invalid: `
    import * as Layer from 'effect/Layer';
    const layer = live.pipe(Layer.orDie);
  `,
  messageId: 'layerOrDie',
});
