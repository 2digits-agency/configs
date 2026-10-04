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
      if (value.status === 'Ready') handleReady(value);
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
