import { rules } from '../../../src';
import { testRule } from '../../rule-tester';

for (const invalid of [
  'const value = { _tag: "Ready", payload };',
  'const value = { ["_tag"]: "Ready" };',
  'const value = { "_tag": "Ready" };',
  'Other.when({ _tag: "Ready" });',
]) {
  testRule('no-manual-tagged-construction', rules['no-manual-tagged-construction'], {
    valid: `
      Match.when({ _tag: 'Ready' }, handleReady);
      Match.not({ '_tag': 'Pending' });
      Ready.make({ value });
      new NotFound({ id });
      ({ _tag: tag, value });
      ({ [key]: 'Ready' });
      ({ ...value });
    `,
    invalid,
    messageId: 'manualConstruction',
  });
}
