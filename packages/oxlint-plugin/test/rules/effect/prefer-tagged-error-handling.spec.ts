import { rules } from '../../../src';
import { testRule } from '../../rule-tester';

const name = 'prefer-tagged-error-handling';

const rule = rules[name];

for (const invalid of [
  'Effect.catch((error) => Predicate.isTagged(error, "NotFound") ? recover : Effect.fail(error));',
  'Effect.catchAll(function (error) { return Predicate.isTagged("NotFound")(error) ? recover : fail; });',
  'Effect.catchIf((error) => Predicate.isTagged(error, "NotFound"), () => recover);',
  `
    import * as P from 'effect/Predicate'
    Effect.catch((error) => P.isTagged(error, "NotFound") ? recover : fail)
  `,
  `
    import { isTagged } from 'effect/Predicate'
    Effect.catch((error) => isTagged("NotFound")(error) ? recover : fail)
  `,
]) {
  testRule(name, rule, {
    valid: `
      const isNotFound = Predicate.isTagged("NotFound");
      if (Predicate.isTagged(result, "Ready")) useReady(result);
      Effect.catchTag("NotFound", () => recover);
      Effect.catch((error) => Effect.fail(error));
      Effect.catch((error) => items.filter((item) => Predicate.isTagged(item, "Ready")));
      Other.catch((error) => Predicate.isTagged(error, "NotFound"));
      Effect.catch((error) => Other.isTagged(error, "NotFound"));
      Effect.catch((error) => Predicate.isTagged(error, "NotFound", extra));
    `,
    invalid,
    messageId: 'taggedError',
  });
}

for (const invalid of [
  'Effect.catch((error) => Predicate.isTagged(error.reason, "Timeout") ? retry : fail);',
  'Effect.catchAll((error) => Predicate.isTagged("Timeout")(error["reason"]) ? retry : fail);',
]) {
  testRule(name, rule, {
    valid: 'Effect.catchTag("Wrapper", (error) => Predicate.isTagged(error.reason, "Timeout") ? retry : fail);',
    invalid,
    messageId: 'taggedReason',
  });
}
