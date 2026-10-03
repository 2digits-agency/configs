/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null, sonar/no-duplicate-string -- Keep no-fix assertions and table cases explicit. */
import { noEmptyEffectCallback } from '../../../src/rules/effect/no-empty-effect-callback';
import { testRule } from '../../rule-tester';

testRule('no-empty-effect-callback', noEmptyEffectCallback, {
  valid: `
    import * as Fx from 'effect/Effect'
    const blocked = Fx.never
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    const blocked = Fx.callback(() => {})
  `,
  messageId: 'emptyCallback',
  output: `
    import * as Fx from 'effect/Effect'
    const blocked = Fx.never
  `,
});

testRule('no-empty-effect-callback', noEmptyEffectCallback, {
  valid: `import * as Fx from 'effect/Effect'; Fx.callback((resume) => { resume(Fx.succeed('done')); });`,
  invalid: `import * as Fx from 'effect/Effect'; Fx.callback((_resume) => { server.listen(port); });`,
  messageId: 'unusedResume',
  output: null,
});

for (const registration of [
  `(resume) => { throw new Error('defect'); }`,
  `(resume) => { server.listen(port); throw new Error('defect'); }`,
  `(resume) => { function handler() {} throw new Error('defect'); }`,
  `(resume) => { debugger; throw new Error('defect'); }`,
  `(resume) => { { server.listen(port); } throw new Error('defect'); }`,
  `(resume) => { { throw new Error('defect'); } }`,
  `function (resume) { register(arguments[0]); }`,
  `(resume) => { eval('register(resume)'); }`,
  `(resume) => { server.on('done', () => resume(Fx.succeed('done'))); }`,
  `(resume) => { register(resume); }`,
  `(resume) => { const finish = resume; register(finish); }`,
  `(resume) => { exportedResume = resume; return Fx.sync(cleanup); }`,
  `(resume) => { return resume; }`,
  `(resume) => resume`,
  `(resume) => { server.on('error', (error) => resume(Fx.fail(error))); }`,
  `() => { server.listen(port); }`,
  `({ resume }) => { server.listen(port); }`,
  `(resume = getResume()) => { server.listen(port); }`,
  `async (resume) => { server.listen(port); }`,
  `function* (resume) { server.listen(port); }`,
  `(resume) => { function handler() { eval('register(resume)'); } register(handler); }`,
  `function (resume) { register(() => arguments[0]); }`,
]) {
  testRule('no-empty-effect-callback', noEmptyEffectCallback, {
    valid: `import * as Fx from 'effect/Effect'; Fx.callback(${registration});`,
    invalid: `import * as Fx from 'effect/Effect'; Fx.callback((resume) => { server.listen(port); });`,
    messageId: 'unusedResume',
    output: null,
  });
}

for (const invalid of [
  `import { callback as register } from 'effect/Effect'; register((finish) => { server.listen(port); });`,
  `import { Effect as E } from 'effect'; E.callback((resume) => { server.listen(port); });`,
  `import * as Fx from 'effect/Effect'; Fx.async((resume) => { server.listen(port); });`,
  `import * as Fx from 'effect/Effect'; Fx.callback((resume) => server.listen(port));`,
  `import * as Fx from 'effect/Effect'; Fx.callback((resume) => { server.listen(server.arguments); });`,
  `import * as Fx from 'effect/Effect'; Fx.callback((resume) => { register({ arguments: port }); });`,
  `import * as Fx from 'effect/Effect'; Fx.callback((resume) => {
    { if (stopped) return; } throw new Error('only on the remaining path');
  });`,
  `import * as Fx from 'effect/Effect'; Fx.callback((resume) => {
    server.on('done', (resume) => resume());
  });`,
  `import * as Fx from 'effect/Effect'; Fx.callback((resume) => {
    { const resume = local; register(resume); }
  });`,
  `import * as Fx from 'effect/Effect'; Fx.callback((resume) => {
    if (failed) throw new Error('conditional'); server.listen(port);
  });`,
  `import * as Fx from 'effect/Effect'; Fx.callback((resume) => {
    if (stopped) return; throw new Error('only on the remaining path');
  });`,
]) {
  testRule('no-empty-effect-callback', noEmptyEffectCallback, {
    valid: `import * as Fx from 'effect/Effect'; function f(Fx) { Fx.callback((resume) => { server.listen(port); }); }`,
    invalid,
    messageId: 'unusedResume',
    output: null,
  });
}

testRule('no-empty-effect-callback', noEmptyEffectCallback, {
  valid: `import { callback as register } from 'effect/Effect';
    function f(register) { register((resume) => { server.listen(port); }); }`,
  invalid: `import * as Fx from 'effect/Effect'; Fx.callback(function (resume) { server.listen(port); });`,
  messageId: 'unusedResume',
  output: null,
});
