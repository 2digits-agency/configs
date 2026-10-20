import * as Arr from 'effect/Array';

import { testRule } from '../../rule-tester';

testRule('no-manual-tag-comparison', {
  valid: [
    `
      Predicate.isTagged('Ready')(value);
      Match.value(value).pipe(Match.tag('Ready', handleReady));
      if (value.status === 'Ready') handleReady(value);
      Effect.catch(error => error._tag === 'NotFound' ? recover : fail);
      value._tag === tag;
      value[key] === 'Ready';
      value._tag > 'Ready';
    `,
    'Effect.catch(error => { switch (error._tag) { case "Missing": return recover; } });',
  ],
  invalid: [
    ...Arr.map(
      [
        'value._tag === "Ready";',
        '"Ready" !== value["_tag"];',
        'value._tag == "Ready";',
        'value._tag != "Ready";',
        'Effect.catch(error => () => error._tag === "Missing");',
      ],
      (code) => ({ code, errors: [{ messageId: 'manualComparison' }] }),
    ),
    { code: 'switch (value._tag) { case "Ready": handleReady(value); }', errors: [{ messageId: 'manualSwitch' }] },
  ],
});
