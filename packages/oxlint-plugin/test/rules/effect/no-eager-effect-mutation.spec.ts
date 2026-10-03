import { noEagerEffectMutation } from '../../../src/rules/effect/no-eager-effect-mutation';
import { testRule } from '../../rule-tester';

testRule('no-eager-effect-mutation', noEagerEffectMutation, {
  valid: `
    import * as Effect from 'effect/Effect';
    function build() {
      const events: Array<string> = [];
      events.push('local');
      return Effect.succeed(events);
    }
  `,
  invalid: `
    import * as Effect from 'effect/Effect';
    const events: Array<string> = [];
    function send() {
      events.push('sent');
      return Effect.void;
    }
  `,
  messageId: 'eagerMutation',
});

const effect = `import * as Fx from 'effect/Effect';`;

for (const [valid, invalid] of [
  [
    `function f(state) { state = {}; return Fx.void; }`,
    `function f(state) { if (state) { state.count++; } return Fx.void; }`,
  ],
  [
    `function f() { let count = 0; count++; return Fx.void; }`,
    `let count = 0; function f() { count++; count += 2; return Fx.succeed(count); }`,
  ],
  [
    `const faults = []; function f() { const faults = []; faults.shift(); return Fx.fail('x'); }`,
    `const faults = []; function f() { const fault = faults.shift(); return Fx.fail(fault); }`,
  ],
  [
    `const events = []; function f() { events.push('x'); return Fx.isEffect(events); }`,
    `const events = []; function f() { events.push('x'); return Fx.succeed(1).pipe(Fx.asVoid); }`,
  ],
  [
    `const events = []; function f(Fx) { events.push('x'); return Fx.void; }`,
    `const events = []; function f() { events.push('x'); return true ? Fx.void : Fx.fail('x'); }`,
  ],
  [
    `const events = []; function f() { return Fx.suspend(() => { events.push('x'); return Fx.void; }); }`,
    `const events = []; function f() { events.push('x'); return Fx.suspend(() => Fx.void); }`,
  ],
  [
    `const events = []; const f = Fx.fn('f')(() => { events.push('x'); return Fx.void; });`,
    `const events = []; const f = Fx.fn('f')(() => Fx.void, (effect) => { events.push('x'); return Fx.asVoid(effect); });`,
  ],
  [
    `const events = []; const f = Fx.fn(() => { events.push('x'); return Fx.void; });`,
    `const events = []; function outer(Fx) { return Fx.fn(() => { events.push('x'); return importEffect.void; }); }
     import * as importEffect from 'effect/Effect';`,
  ],
  [
    `const events = []; const f = Fx.fn('f')(function* () { events.push('x'); return yield* Fx.void; });`,
    `const events = []; const f = Fx.fnUntraced(function* () { return yield* Fx.void; }, () => { events.push('x'); return Fx.void; });`,
  ],
  [
    `const events = []; Fx.gen(function* () { events.push('x'); return yield* Fx.void; });
     Fx.sync(() => { events.push('y'); return Fx.void; });`,
    `const events = []; function f() { function inner() { events.push('x'); return 3; } return Fx.void; }
     function g() { events.push('y'); return Fx.void; }`,
  ],
  [
    `import { HttpClient as Client } from 'effect/http'; const events = [];
     Client.make(() => { events.push('x'); return Fx.void; });`,
    `import { HttpClient as Client } from 'effect/http'; const events = [];
     Client.makeWith(() => { events.push('x'); return Fx.void; }, Fx.succeed);`,
  ],
  [
    `const events = []; function f() { events.push('x'); return helper(); }`,
    `const events = []; function f(): Fx.Effect<void> { events.push('x'); return helper(); }`,
  ],
  [
    `function f(queue: { push: Function }) { queue.push('x'); return Fx.void; }`,
    `function f(queue: Array<string>) { queue.push('x'); return Fx.void; }`,
  ],
  [
    `const state = {}; function f() { const local = { ...state }; Object.assign(local, { n: 1 }); return Fx.void; }`,
    `function f(state: Record<string, number>) { Object.assign(state, { n: 1 }); return Fx.void; }`,
  ],
  [
    `const events = []; const f = () => { return Fx.void; events.push('unreachable'); };`,
    `const events = []; const f = () => (events.push('x'), Fx.void);`,
  ],
  [
    `type Array<T> = { push: (value: T) => void }; function f(events: Array<string>) { events.push('x'); return Fx.void; }`,
    `const state = {}; const f = function () { state['count'] = 1; return Fx.void; };`,
  ],
  [
    `const events = []; class C { f() { events.push('x'); return Fx.void; } }`,
    `const events = []; const f = { send() { events.push('x'); return Fx.void; } };`,
  ],
  [
    `import type * as TypeEffect from 'effect/Effect'; const events = [];
     function f() { events.push('x'); return TypeEffect.void; }`,
    `import type * as TypeEffect from 'effect/Effect'; const events = [];
     function f(): TypeEffect.Effect<void> { events.push('x'); return helper(); }`,
  ],
  [
    `const events = []; function f(): Fx.Effect<void> { type Fx = { Effect: number }; return helper(); }`,
    `import { succeed as done } from 'effect/Effect'; const events = [];
     function f() { events.push('x'); return done(3); }`,
  ],
  [
    `const queue = { push() {} }; function f() { queue.push('x'); return Fx.void; }`,
    `const queue: string[] = getQueue(); function f() { queue.splice(1, 2); return Fx.void; }`,
  ],
  [
    `const events = []; async function f() { events.push('x'); return Fx.void; }`,
    `const events = []; function f() { if (true) { events.push('x'); } else { events.push('y'); } return Fx.void; }`,
  ],
  [
    `import * as Stream from 'effect/Stream'; let bytes = 0;
     Stream.runForEach((chunk) => { bytes += chunk.length; return Fx.void; });`,
    `import * as Stream from 'effect/Stream'; let bytes = 0;
     function f(Stream) { Stream.runForEach((chunk) => { bytes += chunk.length; return Fx.void; }); }`,
  ],
  [
    `const events = []; Fx.flatMap(Fx.void, () => { events.push('x'); return Fx.void; });`,
    `const events = []; Fx.all([1].map(() => { events.push('x'); return Fx.void; }));`,
  ],
  [
    `const events = []; Fx.catchTag('Error', () => { events.push('x'); return Fx.void; });`,
    `const events = []; Fx.fn(() => Fx.void)(() => { events.push('x'); return Fx.void; });`,
  ],
  [
    `const events = []; function f() { events.push('x'); return Fx.catchTag('Error', () => Fx.void); }`,
    `const events = []; function f() { events.push('x'); return Fx.catchTag(Fx.fail('x'), 'Error', () => Fx.void); }`,
  ],
  [
    `const events = []; function f() { events.push('x'); return Fx.forEach(() => Fx.void, { concurrency: 2 }); }`,
    `const events = []; function f() { events.push('x'); return Fx.forEach([1], () => Fx.void); }`,
  ],
  [
    `const events = []; function f() { events.push('x'); return Fx.void.pipe(Fx.map); }`,
    `const events = []; function f() { events.push('x'); return Fx.void.pipe(Fx.map(() => 1)); }`,
  ],
  [
    `function f(state) { state = { ...state }; state.count++; return Fx.void; }`,
    `function f(state) { state.count++; state = { ...state }; return Fx.void; }`,
  ],
  [
    `const events = []; const options = { self: {} };
     Fx.fn(options, function () { events.push('x'); return Fx.void; });`,
    `const events = []; const body = () => Fx.void;
     Fx.fn(body, (operation) => { events.push('x'); return Fx.asVoid(operation); });`,
  ],
  [
    `const events = []; const options = { self: {} };
     Fx.fn('f')(options, function () { events.push('x'); return Fx.void; });`,
    `const events = []; let options = { self: {} }; options = () => Fx.void;
     Fx.fn(options, (operation) => { events.push('x'); return Fx.asVoid(operation); });`,
  ],
] as const) {
  testRule('no-eager-effect-mutation', noEagerEffectMutation, {
    valid: `${effect} ${valid}`,
    invalid: `${effect} ${invalid}`,
    messageId: 'eagerMutation',
  });
}
