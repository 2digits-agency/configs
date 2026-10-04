import { rules } from '../../../src';
import { testRule } from '../../rule-tester';

const name = 'no-manual-effect-error-tag';
const rule = rules[name];

for (const invalid of [
  'Effect.catch((error) => error._tag === "NotFound" ? recover : fail);',
  'Effect.catchIf(predicate, (error) => { switch (error._tag) { case "NotFound": return recover; } });',
  'Effect.catchAll((error) => "NotFound" != error["_tag"]);',
]) {
  testRule(name, rule, {
    valid: 'error._tag === "NotFound"; Effect.catchTag("NotFound", recover);',
    invalid,
    messageId: 'tag',
  });
}

for (const invalid of [
  'Effect.catchAll(function (error) { return error.reason._tag === "Timeout" ? retry : fail; });',
  'Effect.catch((error) => { switch (error["reason"]["_tag"]) { case "Timeout": return retry; } });',
]) {
  testRule(name, rule, {
    valid: 'Effect.catchTag("Wrapper", (error) => error.reason._tag === "Timeout" ? retry : fail);',
    invalid,
    messageId: 'reason',
  });
}

testRule(name, rule, {
  valid: `
    Other.catch(error => error._tag === 'Missing');
    Effect.catch(error => () => error._tag === 'Missing');
    Effect.catch(error => error._tag === tag);
    Effect.catch(error => error.status === 'Missing');
    Effect.catch(error => error[key] === 'Missing');
  `,
  invalid: 'Effect.catch(error => error._tag == "Missing");',
  messageId: 'tag',
});
