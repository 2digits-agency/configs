import * as Arr from 'effect/Array';

import { testRule } from '../../rule-tester';

testRule('no-manual-effect-error-tag', {
  valid: [
    'error._tag === "NotFound"; Effect.catchTag("NotFound", recover);',
    'Effect.catchTag("Wrapper", (error) => error.reason._tag === "Timeout" ? retry : fail);',
    `
    Other.catch(error => error._tag === 'Missing');
    Effect.catch(error => () => error._tag === 'Missing');
    Effect.catch(error => error._tag === tag);
    Effect.catch(error => error.status === 'Missing');
    Effect.catch(error => error[key] === 'Missing');
  `,
  ],
  invalid: [
    ...Arr.map(
      [
        'Effect.catch((error) => error._tag === "NotFound" ? recover : fail);',
        'Effect.catchIf(predicate, (error) => { switch (error._tag) { case "NotFound": return recover; } });',
        'Effect.catchAll((error) => "NotFound" != error["_tag"]);',
        'Effect.catch(error => error._tag == "Missing");',
      ],
      (code) => ({ code, errors: [{ messageId: 'tag' }] }),
    ),
    ...Arr.map(
      [
        'Effect.catchAll(function (error) { return error.reason._tag === "Timeout" ? retry : fail; });',
        'Effect.catch((error) => { switch (error["reason"]["_tag"]) { case "Timeout": return retry; } });',
      ],
      (code) => ({ code, errors: [{ messageId: 'reason' }] }),
    ),
  ],
});
