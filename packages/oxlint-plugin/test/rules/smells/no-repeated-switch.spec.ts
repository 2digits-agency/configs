import { describe, it } from '@effect/vitest';
import { RuleTester } from 'oxlint/plugins-dev';

import { noRepeatedSwitch } from '../../../src/rules/smells/no-repeated-switch';

RuleTester.describe = describe;

RuleTester.it = it;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
  },
});

// Every case repeats a switch in two places, so each reports twice.
function errors(expression: string) {
  return Array.from({ length: 2 }, () => ({ messageId: 'repeated', data: { expression, count: '2' } }));
}

tester.run('no-repeated-switch', noRepeatedSwitch, {
  valid: [
    // One switch is a dispatch, not a repeated one.
    "function label(e) { switch (e._tag) { case 'A': return 1; case 'B': return 3; default: return 2; } }",
    // Different values.
    "switch (a.kind) { case 'x': case 'y': } switch (b.kind) { case 'x': case 'y': }",
    // The same text, but the cases barely overlap, so these are likely different unions.
    "switch (part.type) { case 'text': case 'image': } switch (part.type) { case 'text': case 'tool_use': }",
    // A single comparison is a guard, not a switch.
    "if (event.type === 'click') a(); function f() { if (event.type === 'key') b(); }",
    // `switch (true)` has no discriminant.
    'switch (true) { case a: case b: break; } switch (true) { case a: case b: break; }',
    // Guards separated by other statements are separate guards.
    "if (k === 'a') a(); log(); if (k === 'b') b(); if (k === 'a') a(); log(); if (k === 'b') b();",
    // Comparing two non-literal values is not a case test.
    'if (a.id === b.id) x(); else if (a.id === c.id) y(); if (a.id === b.id) z(); else if (a.id === c.id) w();',
    // A guard with an `else` ends a run of guards.
    "function f(k) { if (k === 'a') return 1; else run(); if (k === 'b') return 2; } switch (k) { case 'a': case 'b': }",
    {
      code: "switch (e._tag) { case 'A': case 'B': } switch (e._tag) { case 'A': case 'B': }",
      filename: 'events.spec.ts',
    },
  ],
  invalid: [
    {
      code: `
        function area(shape) { switch (shape.kind) { case 'circle': return 1; case 'square': return 2; } }
        function name(shape) { switch (shape.kind) { case 'circle': return 'c'; case 'square': return 's'; } }
      `,
      errors: errors('shape.kind'),
    },
    {
      code: `
        function a(e) { if (e._tag === 'Ready') return 1; else if (e._tag === 'Done') return 2; }
        function b(e) { return e._tag === 'Ready' ? 'r' : (e._tag === 'Done' ? 'd' : 'x'); }
      `,
      errors: errors('e._tag'),
    },
    {
      // Runs of guards, `||` and enum members count as cases.
      code: `
        function a(kind) {
          if (kind === Kind.A) return 1;
          if (kind === Kind.B || kind === Kind.C) return 2;
          return 3;
        }
        function b(kind) { switch (kind) { case Kind.A: return 'a'; case Kind.C: return 'c'; } }
      `,
      errors: errors('kind'),
    },
    {
      code: "switch (typeof value) { case 'string': case 'number': } const t = typeof value === 'string' ? 1 : typeof value === 'number' ? 2 : 3;",
      errors: errors('typeof value'),
    },
    {
      // The third switch shares only one case with the others, so it is left out.
      code: `
        switch (order.status) { case 'paid': case 'sent': }
        switch (order.status) { case 'sent': case 'paid': case 'lost': }
        switch (order.status) { case 'lost': case 'new': }
      `,
      errors: errors('order.status'),
    },
  ],
});
