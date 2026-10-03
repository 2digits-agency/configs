/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
import { preferWithSpan } from '../../../src/rules/effect/prefer-with-span';
import { testRule } from '../../rule-tester';

const ruleName = 'prefer-with-span';

testRule(ruleName, preferWithSpan, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', (span) => addAttributes(span))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', () => program)
  `,
  messageId: 'unusedSpan',
});

testRule(ruleName, preferWithSpan, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', (_span) => addAttributes(_span))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', (span) => Fx.succeed({ span: 1 }))
  `,
  messageId: 'unusedSpan',
});

testRule(ruleName, preferWithSpan, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', ({ spanId }) => recordId(spanId))
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', ({ spanId }) => () => {
      const spanId = 'unrelated'
      return recordId(spanId)
    })
  `,
  messageId: 'unusedSpan',
});

for (const options of ['', '{ attributes: {} }, ']) {
  for (const [valid, invalid] of [
    ['span => addAttributes(span)', 'span => program'],
    ['_span => addAttributes(_span)', '_span => program'],
    ['span => Fx.succeed({ span })', 'span => Fx.succeed({ span: 1 })'],
    ['span => () => addAttributes(span)', "span => () => { const span = 'other'; return addAttributes(span) }"],
    ['({ spanId }) => recordId(spanId)', "span => Fx.succeed('span') /* span */"],
    ['({ spanId: id, traceId }) => recordId(traceId)', '({ spanId: id }) => program'],
    ['({ context: { spanId } }) => recordId(spanId)', '({ context: { spanId } }) => program'],
    ['([spanId]) => recordId(spanId)', '([, spanId]) => program'],
    ['function trace(span) { return addAttributes(span) }', 'function trace(span) { return program }'],
    ['(span, other) => addAttributes(span)', '(span, other) => addAttributes(other)'],
    ['(span = fallback()) => program', '() => program'],
    ['({ spanId = fallback() }) => program', '({ spanId }) => program'],
    ['(...spans) => program', '(span) => program'],
    ['({ [key()]: spanId }) => program', '({ spanId }) => program'],
  ]) {
    testRule(ruleName, preferWithSpan, {
      valid: `import * as Fx from 'effect/Effect'; Fx.useSpan('request', ${options}${valid})`,
      invalid: `import * as Fx from 'effect/Effect'; Fx.useSpan('request', ${options}${invalid})`,
      messageId: 'unusedSpan',
      output: null,
    });
  }
}

for (const [importStatement, callee] of [
  ["import { Effect as Fx } from 'effect'", 'Fx.useSpan'],
  ["import * as Fx from 'effect'", 'Fx.Effect.useSpan'],
  ["import { useSpan as trace } from 'effect/Effect'", 'trace'],
]) {
  for (const options of ['', '{ attributes: {} }, ']) {
    testRule(ruleName, preferWithSpan, {
      valid: `${importStatement}; ${callee}('request', ${options}_span => addAttributes(_span))`,
      invalid: `${importStatement}; ${callee}('request', ${options}_span => program)`,
      messageId: 'unusedSpan',
      output: null,
    });
  }
}

testRule(ruleName, preferWithSpan, {
  valid: `
    import * as Fx from 'effect/Effect'
    import { useSpan as trace } from 'effect/Effect'
    Fx.useSpan('request', callback)
    Fx.useSpan('request', {}, callback)
    Fx.useSpan('request', makeCallback())
    function demo(trace) { return trace('request', () => program) }
    { const Fx = unrelated; Fx.useSpan('request', () => program) }
    unrelated.useSpan('request', () => program)
  `,
  invalid: `import * as Fx from 'effect/Effect'; Fx.useSpan('request', {}, () => program)`,
  messageId: 'unusedSpan',
  output: null,
});

testRule(ruleName, preferWithSpan, {
  valid: `
    import type * as Fx from 'effect/Effect'
    import { type useSpan as trace } from 'effect/Effect'
    Fx.useSpan('request', () => program)
    trace('request', () => program)
  `,
  invalid: `import * as Fx from 'effect/Effect'; Fx.useSpan('request', () => program)`,
  messageId: 'unusedSpan',
  output: null,
});

testRule(ruleName, preferWithSpan, {
  valid: `
    import * as Fx from 'effect/Effect'
    function demo(Fx) {
      return Fx.useSpan('request', () => program)
    }
  `,
  invalid: `
    import { useSpan as trace } from 'effect/Effect'
    trace('request', { attributes: {} }, () => program)
  `,
  messageId: 'unusedSpan',
});

testRule(ruleName, preferWithSpan, {
  valid: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan(() => program)
    Fx.useSpan('request', {}, extra, () => program)
    Fx.useSpan('request', ...options, () => program)
  `,
  invalid: `
    import * as Fx from 'effect/Effect'
    Fx.useSpan('request', (span) => () => {
      const span = 'unrelated'
      return addAttributes(span)
    })
  `,
  messageId: 'unusedSpan',
});
