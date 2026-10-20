import * as Arr from 'effect/Array';

import { testRule } from '../../rule-tester';

testRule('prefer-effect-match', {
  valid: [
    `
    import * as Match from 'effect/Match'
    const render = Match.type<{ _tag: 'Found' } | { _tag: 'Missing' }>().pipe(
      Match.tagsExhaustive({ Found: () => 'found', Missing: () => 'missing' }),
    )
  `,
    `
      kind === 'a' ? first : fallback;
      kind === 'a' ? first : other === 'b' ? second : fallback;
      condition ? first : otherCondition ? second : fallback;
      kind === dynamic ? first : kind === other ? second : fallback;
    `,
  ],
  invalid: [
    {
      code: `
    import * as Effect from 'effect/Effect'
    function render(value: { _tag: string }) {
      switch (value._tag) {
        case 'Found': return 'found'
        default: return 'missing'
      }
    }
  `,
      errors: [{ messageId: 'effectMatch' }],
    },
    ...Arr.map(
      [
        'kind === "a" ? first : kind === "b" ? second : fallback;',
        '`a` !== kind ? first : `b` === kind ? second : fallback;',
        'kind == 1 ? first : kind != 2 ? second : kind === 3 ? third : fallback;',
      ],
      (code) => ({ code, errors: [{ messageId: 'preferMatch' }] }),
    ),
  ],
});
