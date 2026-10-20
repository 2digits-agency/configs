import * as Arr from 'effect/Array';

import { testRule } from '../../rule-tester';

testRule('no-manual-tagged-construction', {
  valid: [
    `
      Match.when({ _tag: 'Ready' }, handleReady);
      Match.not({ '_tag': 'Pending' });
      Ready.make({ value });
      new NotFound({ id });
      ({ _tag: tag, value });
      ({ [key]: 'Ready' });
      ({ ...value });
    `,
  ],
  invalid: Arr.map(
    [
      'const value = { _tag: "Ready", payload };',
      'const value = { ["_tag"]: "Ready" };',
      'const value = { "_tag": "Ready" };',
      'Other.when({ _tag: "Ready" });',
    ],
    (code) => ({ code, errors: [{ messageId: 'manualConstruction' }] }),
  ),
});
