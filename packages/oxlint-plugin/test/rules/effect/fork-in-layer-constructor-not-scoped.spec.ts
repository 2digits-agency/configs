/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
import { RuleTester } from 'oxlint/plugins-dev';

import { forkInLayerConstructorNotScoped } from '../../../src/rules/effect/fork-in-layer-constructor-not-scoped';
import { testRule } from '../../rule-tester';

const ruleName = 'fork-in-layer-constructor-not-scoped';

testRule(ruleName, forkInLayerConstructorNotScoped, {
  valid: `
    import { Effect, Layer } from 'effect';
    Layer.effect(Tag, Effect.gen(function*() {
      yield* Effect.forkScoped(loop);
      return {};
    }));
  `,
  invalid: `
    import { Effect, Layer } from 'effect';
    Layer.effect(Tag, Effect.gen(function*() {
      yield* Effect.forkChild(loop);
      return {};
    }));
  `,
  messageId: 'constructorFork',
  output: null,
});

for (const fork of ['Fx.forkChild', 'Fx.forkChild()', 'Fx.forkChild({ startImmediately: true })']) {
  testRule(ruleName, forkInLayerConstructorNotScoped, {
    valid: `
      import * as Fx from 'effect/Effect';
      import { effect as layer } from 'effect/Layer';
      const loop = Fx.never;
      layer(Tag, Fx.gen(function*() {
        const unexecuted = loop.pipe(${fork});
        return { send: () => Fx.gen(function*() { yield* loop.pipe(${fork}); }) };
      }));
    `,
    invalid: `
      import * as Fx from 'effect/Effect';
      import { effect as layer } from 'effect/Layer';
      const loop = Fx.never;
      layer(Tag, Fx.gen(function*() {
        yield* loop.pipe(${fork});
        return {};
      }));
    `,
    messageId: 'constructorFork',
    output: null,
  });
}

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });
const imports = `import { Effect, Fiber, Layer, Stream } from 'effect';`;

tester.run(`${ruleName} execution boundaries`, forkInLayerConstructorNotScoped, {
  valid: [
    `${imports} Effect.gen(function*() { yield* Effect.forkChild(loop); });`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() { Effect.forkChild(loop); return {}; }));`,
    `${imports} const fake = { pipe: (_fork) => Effect.void };
      Layer.effect(Tag, Effect.gen(function*() {
        yield* fake.pipe(Effect.forkChild({ startImmediately: true })); return {};
      }));`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() {
      yield* unknown().pipe(Effect.forkChild); return {};
    }));`,
    `${imports} const options = { startImmediately: true };
      Layer.effect(Tag, Effect.gen(function*() { yield* Effect.forkChild(options); return {}; }));`,
    `${imports} const loop = Effect.never;
      function f(loop) { Layer.effect(Tag, Effect.gen(function*() {
        yield* loop.pipe(Effect.forkChild); return {};
      })); }`,
    `${imports} const options = { startImmediately: true };
      function f(options) { Layer.effect(Tag, Effect.gen(function*() {
        yield* Effect.never.pipe(Effect.forkChild(options)); return {};
      })); }`,
    `${imports} const loop = loop;
      Layer.effect(Tag, Effect.gen(function*() { yield* loop.pipe(Effect.forkChild); return {}; }));`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() { yield* Effect.forkChild({ startImmediately: true }); }));`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() { yield* Effect.forkScoped(loop); return {}; }));`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() { yield* Effect.forkDaemon(loop); return {}; }));`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() { yield* Effect.forkDetach(loop); return {}; }));`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() {
      function handler() { return Effect.gen(function*() { yield* Effect.forkChild(loop); }); }
      return {};
    }));`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() {
      yield* Effect.forkScoped(Stream.runForEach(events, event =>
        Effect.log(event).pipe(Effect.forkChild, Effect.asVoid)));
      return {};
    }));`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() { yield* start(Effect.forkChild(loop)); return {}; }));`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() { yield* loop.pipe(Effect.forkChild, supervise); }));`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() {
      const work = Effect.gen(function*() { yield* Effect.forkChild(loop); });
      yield* unknown(work);
      return {};
    }));`,
    `${imports} function f(Effect) {
      Layer.effect(Tag, Effect.gen(function*() { yield* Effect.forkChild(loop); return {}; }));
    }`,
    `${imports} function f(Layer) {
      Layer.effect(Tag, Effect.gen(function*() { yield* Effect.forkChild(loop); return {}; }));
    }`,
    `${imports} Layer.effect(Tag, Effect.gen(function*(Effect) { yield* Effect.forkChild(loop); return {}; }));`,
    `import { Layer } from 'effect'; import * as Effect from 'other';
      Layer.effect(Tag, Effect.gen(function*() { yield* Effect.forkChild(loop); return {}; }));`,
    `import type { Effect, Layer } from 'effect';
      Layer.effect(Tag, Effect.gen(function*() { yield* Effect.forkChild(loop); return {}; }));`,
    `import { Context, Effect } from 'effect'; function f(Context) {
      Context.Service()('Service', { make: Effect.gen(function*() { yield* Effect.forkChild(loop); return {}; }) });
    }`,
    `${imports} Layer.effect(Tag, Effect.gen(function*() {
      return {};
      yield* Effect.forkChild(loop);
    }));`,
  ],
  invalid: [
    {
      code: `import { gen, sync, forkChild } from 'effect/Effect'; import { effect } from 'effect/Layer';
        const loop = sync(() => {}); const alias = loop;
        effect(Tag, gen(function*() { yield* alias.pipe(forkChild); return {}; }));`,
      errors: [{ messageId: 'constructorFork' }],
      output: null,
    },
    {
      code: `${imports} const options = { startImmediately: true };
        Layer.effect(Tag, Effect.gen(function*() {
          yield* Effect.never.pipe(Effect.forkChild(options)); return {};
        }));`,
      errors: [{ messageId: 'constructorFork' }],
      output: null,
    },
    {
      code: `${imports} Layer.effect(Tag, Effect.gen(function*() {
        const child = yield* Effect.forkChild(loop);
        Fiber.join(child);
        return {};
      }));`,
      errors: [{ messageId: 'constructorFork' }],
      output: null,
    },
    {
      code: `${imports} const loop = Effect.never;
        Layer.effect(Tag, Effect.gen(function*() {
        const child = yield* loop.pipe(Effect.forkChild);
        { const child = other; yield* Fiber.join(child); }
        return {};
      }));`,
      errors: [{ messageId: 'constructorFork' }],
      output: null,
    },
    {
      code: `import * as E from 'effect'; E.Layer.effect(Tag, E.Effect.gen(function*() {
        yield* E.Effect.forkChild(loop);
        return {};
      }));`,
      errors: [{ messageId: 'constructorFork' }],
      output: null,
    },
  ],
});

// Effect v3: Layer.effect retains Scope requirements; Layer.scoped discharges them.
for (const constructor of ['effect', 'scoped']) {
  testRule(ruleName, forkInLayerConstructorNotScoped, {
    valid: `
      import { Effect, Layer } from 'effect';
      Layer.scoped(Tag, Effect.gen(function*() {
        yield* Effect.forkScoped(loop);
        return {};
      }));
    `,
    invalid: `
      import { Effect, Layer } from 'effect';
      Layer.${constructor}(Tag, Effect.gen(function*() {
        yield* Effect.fork(loop);
        return {};
      }));
    `,
    messageId: 'constructorFork',
    output: null,
  });
}

testRule(ruleName, forkInLayerConstructorNotScoped, {
  valid: `
    import { Effect, Fiber, Layer } from 'effect';
    Layer.scoped(Tag, Effect.gen(function*() {
      const child = yield* Effect.never.pipe(Effect.fork);
      yield* Fiber.join(child);
      return {};
    }));
  `,
  invalid: `
    import { Effect, Layer } from 'effect';
    Layer.scoped(Tag, Effect.gen(function*() {
      yield* Effect.never.pipe(Effect.fork);
      return {};
    }));
  `,
  messageId: 'constructorFork',
  output: null,
});

testRule(ruleName, forkInLayerConstructorNotScoped, {
  valid: `
    import * as C from 'effect/Context';
    import { gen, forkChild } from 'effect/Effect';
    class Service extends C.Service<Service>()('Service', {
      make: gen(function*() {
        return { send: () => gen(function*() { yield* forkChild(loop); }) };
      }),
    }) {}
  `,
  invalid: `
    import * as C from 'effect/Context';
    import { gen, forkChild } from 'effect/Effect';
    class Service extends C.Service<Service>()('Service', {
      make: gen(function*() {
        const child = yield* forkChild(loop);
        return {};
      }),
    }) {}
  `,
  messageId: 'constructorFork',
  output: null,
});

tester.run(`${ruleName} bound ownership`, forkInLayerConstructorNotScoped, {
  valid: [
    'yield* Fiber.join(child);',
    'yield* child.pipe(Fiber.join);',
    'yield* handOff(child);',
    'return { child };',
    'if (ready) { yield* Fiber.join(child); }',
  ].map(
    (afterFork) => `
      import { Effect, Fiber, Layer } from 'effect';
      Layer.effect(Tag, Effect.gen(function*() {
        const child = yield* Effect.forkChild(loop);
        ${afterFork}
        return {};
      }));
    `,
  ),
  invalid: [
    {
      code: `
      import { Effect, Fiber, Layer } from 'effect';
      Layer.effect(Tag, Effect.gen(function*() {
        const child = yield* Effect.forkChild(loop);
        yield* Effect.addFinalizer(() => Fiber.interrupt(child));
        return {};
      }));
      `,
      errors: [{ messageId: 'constructorFork' }],
      output: null,
    },
  ],
});
