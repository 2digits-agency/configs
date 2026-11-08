import { rules } from '../../../src';
import { testRule } from '../../rule-tester';

const name = 'no-manual-tag-comparison';

const rule = rules[name];

for (const invalid of [
  'value._tag === "Ready";',
  '"Ready" !== value["_tag"];',
  'value._tag == "Ready";',
  'value._tag != "Ready";',
  'Effect.catch(error => () => error._tag === "Missing");',
]) {
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
  });
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
