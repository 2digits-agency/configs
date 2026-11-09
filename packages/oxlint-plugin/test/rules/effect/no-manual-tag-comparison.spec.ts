/* eslint-disable unicorn/no-null -- RuleTester requires null to assert that no fix or suggestion is offered. */
import { rules } from '../../../src';
import { testRule } from '../../rule-tester';

const name = 'no-manual-tag-comparison';

const rule = rules[name];

const isTagged = `import * as P from 'effect/Predicate';\n`;

for (const [invalid, suggestion] of [
  ['value._tag === "Ready";', `${isTagged}P.isTagged(value, "Ready");`],
  ['"Ready" !== value["_tag"];', `${isTagged}!P.isTagged(value, "Ready");`],
  ['value._tag == "Ready";', `${isTagged}P.isTagged(value, "Ready");`],
  ['value._tag != "Ready";', `${isTagged}!P.isTagged(value, "Ready");`],
  ['(0, value)._tag === "Ready";', `${isTagged}P.isTagged((0, value), "Ready");`],
  [
    'import * as Predicate from "effect/Predicate"; next.value._tag === "Ready";',
    'import * as Predicate from "effect/Predicate"; Predicate.isTagged(next.value, "Ready");',
  ],
  [
    'Effect.catch(error => () => error._tag === "Missing");',
    `${isTagged}Effect.catch(error => () => P.isTagged(error, "Missing"));`,
  ],
] as const) {
  testRule(name, rule, {
    valid: `
      Predicate.isTagged('Ready')(value);
      Match.value(value).pipe(Match.tag('Ready', handleReady));
      if (value.state === 'Ready') handleReady(value);
      Effect.catch(error => error._tag === 'NotFound' ? recover : fail);
      value._tag === tag;
      value[key] === 'Ready';
      value._tag > 'Ready';
    `,
    invalid,
    messageId: 'manualComparison',
    output: null,
    suggestions: [{ messageId: 'isTagged', output: suggestion }],
  });
}

// Other discriminants have no Predicate helper, and a rewrite would drop the comment.
for (const [invalid, messageId] of [
  ['value._tag /* why */ === "Ready";', 'manualComparison'],
  ['value.kind === "circle";', 'manualDiscriminantComparison'],
] as const) {
  testRule(name, rule, { valid: '', invalid, messageId, output: null, suggestions: null });
}

testRule(name, rule, {
  valid: 'Effect.catch(error => { switch (error._tag) { case "Missing": return recover; } });',
  invalid: 'switch (value._tag) { case "Ready": handleReady(value); }',
  messageId: 'manualSwitch',
});

for (const invalid of [
  'order.disposition === "ship";',
  '"physical" !== item["productKind"];',
  'Effect.catch(error => error.disposition === "retry" ? recover : fail);',
]) {
  testRule(name, rule, {
    options: [{ discriminants: ['disposition', 'productKind'] }],
    valid: `
      order.status === 'Ready';
      order.disposition === nextDisposition;
      order.disposition === 1;
      Effect.catch(error => error._tag === 'NotFound' ? recover : fail);
    `,
    invalid,
    messageId: 'manualDiscriminantComparison',
  });
}

testRule(name, rule, {
  options: [{ discriminants: ['disposition'] }],
  valid: 'switch (order.status) { case "ship": ship(order); }',
  invalid: 'switch (order.disposition) { case "ship": ship(order); }',
  messageId: 'manualDiscriminantSwitch',
});

testRule(name, rule, {
  options: [{ discriminants: ['disposition'] }],
  valid: 'Predicate.isTagged(value, "Ready");',
  invalid: 'value._tag === "Ready";',
  messageId: 'manualComparison',
});

for (const invalid of ['if (value.status === "Ready") handleReady(value);', '"circle" !== shape.kind;']) {
  testRule(name, rule, {
    valid: `
      value.state === 'Ready';
      response.status === 200;
      Effect.catch(error => error._tag === 'NotFound' ? recover : fail);
    `,
    invalid,
    messageId: 'manualDiscriminantComparison',
  });
}
