/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { noDuplicateFreshLayerFactory } from '../../../src/rules/effect/no-duplicate-fresh-layer-factory';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

const localFactory = `import { Layer, Effect, pipe } from 'effect';
const make = (config) => Layer.effect(Db, Effect.succeed(config));`;

tester.run('no-duplicate-fresh-layer-factory', noDuplicateFreshLayerFactory, {
  valid: [
    `import { Layer } from 'effect';
     const make = (config) => Layer.effect(Db, acquire(config));
     const a = 1, b = 2;
     Layer.merge(make(a), make(b));`,
    `${localFactory} Layer.merge(make('a'), make('b'));`,
    `${localFactory} Layer.merge(make({}), make({}));`,
    `${localFactory} Layer.merge(make(() => 1), make(() => 1));`,
    `${localFactory} Layer.merge(make(config.value), make(config.value));`,
    `${localFactory} let config = 1; Layer.merge(make(config), make(config));`,
    `${localFactory} const config = { value: 1 }; config.value++; Layer.merge(make(config), make(config));`,
    `${localFactory} const config = { value: 1 }; Layer.merge(make(config), (config.value = 2, make(config)));`,
    `${localFactory} const config = { value: 1 }; config.change(); Layer.merge(make(config), make(config));`,
    `${localFactory} const config = { get value() { return Math.random(); } }; Layer.merge(make(config), make(config));`,
    `${localFactory} const config = {}; const alias = config; alias.value = 2; Layer.merge(make(config), make(config));`,
    `${localFactory} const config = {}; mutate(config); Layer.merge(make(config), make(config));`,
    `${localFactory} Layer.merge(make(1), Other); Layer.merge(make(1), Another);`,
    `${localFactory} build(make(1)); build(make(1));`,
    `${localFactory} const shared = make(1); Layer.merge(shared, shared);`,
    `import { Layer } from 'effect'; import { make } from './factory'; Layer.merge(make(1), make(1));`,
    `import { Layer } from 'effect'; const cached = Layer.succeed(Db, {});
     const make = (): Layer.Layer<Db> => cached; Layer.merge(make(), make());`,
    `import { Layer } from 'effect'; const make = (flag) => flag ? Layer.succeed(Db, {}) : cached;
     Layer.merge(make(true), make(true));`,
    `import { Layer } from 'effect'; function make() { if (flag) return cached; return Layer.succeed(Db, {}); }
     Layer.merge(make(), make());`,
    `import { Layer } from 'effect'; let make = () => Layer.succeed(Db, {}); make = other;
     Layer.merge(make(), make());`,
    `import type { Layer } from 'effect'; const make = () => Layer.succeed(Db, {}); Layer.merge(make(), make());`,
    `import * as Layer from 'other'; const make = () => Layer.succeed(Db, {}); Layer.merge(make(), make());`,
    `${localFactory} function owner(Layer) { Layer.merge(make(1), make(1)); }`,
    `${localFactory} function owner(make) { Layer.merge(make(1), make(1)); }`,
    `import { Layer } from 'effect'; function owner(Layer) { const make = () => Layer.succeed(Db, {}); }
     const make = () => cached; Layer.merge(make(), make());`,
    `${localFactory} Layer.merge(make(1), custom(make(1)));`,
    `${localFactory} make(1).pipe(unknown, Layer.provide(make(1)));`,
    `${localFactory} const makeWrapped = () => cached.pipe(Layer.provide(Other));
     Layer.merge(makeWrapped(), makeWrapped());`,
    `${localFactory} const makeWrapped = () => Layer.succeed(Db, {}).pipe(unknown);
     Layer.merge(makeWrapped(), makeWrapped());`,
    `${localFactory} const makeRecursive = () => makeRecursive(); Layer.merge(makeRecursive(), makeRecursive());`,
    `${localFactory} const makePartial = () => Layer.succeed(Db); Layer.merge(makePartial(), makePartial());`,
    `${localFactory} const unrelated = { pipe: (...values) => values }; unrelated.pipe(Layer.provide(make(1)), Layer.provide(make(1)));`,
    `${localFactory} const config = {}; const mutating = (config) => Layer.succeed(Db, config.change());
     Layer.merge(mutating(config), mutating(config));`,
    `${localFactory} make(1).pipe(Layer.mergeAll(make(1)));`,
    `${localFactory} const a = {}; const b = {}; Layer.merge(make(a), make(b));`,
    `${localFactory} const makeRecursive = () => makeRecursive().pipe(Layer.provide(Other)); Layer.merge(makeRecursive(), makeRecursive());`,
    `${localFactory} function owner(Layer) { const local = () => Layer.succeed(Db, {}); return pipe(local(), Layer.merge(local())); }`,
    `import { Layer } from 'effect'; const config = { value: 0 }; const mutate = value => ++value.value;
     function make(config) { const alias = config; const value = mutate(alias); return Layer.succeed(Db, value); }
     Layer.merge(make(config), make(config));`,
    `import { Layer } from 'effect'; const config = { nested: { value: 0 } }; const mutate = value => ++value.value;
     const make = ({ nested }) => Layer.succeed(Db, mutate(nested)); Layer.merge(make(config), make(config));`,
    `import { Layer } from 'effect'; const config = { value: 0 }; const mutate = value => ++value.value;
     const make = config => Layer.succeed(Db, config.value);
     Layer.mergeAll(make(config), Layer.succeed(Other, mutate(true && config)), make(config));`,
    `import { Layer } from 'effect'; const config = { value: 0 }; const mutate = value => ++value.value;
     const make = config => Layer.succeed(Db, mutate(true && config)); Layer.merge(make(config), make(config));`,
  ],
  invalid: [
    {
      code: `import { Layer } from 'effect';
const make = (config) => Layer.effect(Db, acquire(config));
const config = 1;
Layer.merge(make(config), make(config));`,
      errors: [{ messageId: 'duplicate', line: 4, column: 26, data: { name: 'make', earlier: '4:13' } }],
      output: null,
    },
    ...[
      `${localFactory} const config = {}; const A = Layer.succeed(Service, {}); Layer.mergeAll(A.pipe(Layer.provide(make(config))), Layer.provideMerge(B, make(config)));`,
      `${localFactory} pipe(make('same'), Layer.merge(make('same')));`,
      `${localFactory} Layer.provide(make(null))(make(null));`,
      `import { Layer as L } from 'effect'; const arbitraryName = () => L.succeed(Db, {});
       L.merge(arbitraryName(), arbitraryName());`,
      `import * as L from 'effect/Layer'; function arbitraryName(value) { return L.succeed(Db, value); }
       L.mergeAll(arbitraryName(1), arbitraryName(1));`,
      `import { succeed as create, merge as combine } from 'effect/Layer';
       const make = () => create(Db, {}); combine(make(), make());`,
      `import * as Fx from 'effect'; const make = () => Fx.Layer.succeed(Db, {});
       Fx.Layer.merge(make(), make());`,
      `${localFactory} const wrapped = (config) => make(config).pipe(Layer.provide(Other));
       Layer.merge(wrapped(1), wrapped(1));`,
      `${localFactory} function wrapped() { const root = Layer.succeed(Db, {}); const alias = root; return alias.pipe(Layer.provide(Other)); }
       Layer.merge(wrapped(), wrapped());`,
      `${localFactory} const wrapped = () => Layer.provide(Layer.succeed(Db, {}), Other);
       Layer.merge(wrapped(), wrapped());`,
      `${localFactory} Layer.merge(Layer.merge(make(1), make(1)), Other);`,
      `import * as Layer from 'effect/Layer'; const database = {};
       const CacheWarmLive = (database) => Layer.succeed(CacheWarm, database);
       const SystemHandlersLive = Layer.succeed(System, {}), ParkCalendarLive = Layer.succeed(Calendar, {});
       Layer.mergeAll(SystemHandlersLive.pipe(Layer.provide(CacheWarmLive(database))),
         ParkCalendarLive.pipe(Layer.provide([CacheWarmLive(database), Other])));`,
    ].map((code) => ({ code, errors: [{ messageId: 'duplicate' }], output: null })),
    {
      code: `${localFactory} Layer.mergeAll(make(1), make(1), make(1));`,
      errors: [{ messageId: 'duplicate' }, { messageId: 'duplicate' }],
      output: null,
    },
  ],
});
