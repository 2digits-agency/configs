import { preferEffectMatch } from '../../../src/rules/effect/prefer-effect-match';
import { testRule } from '../../rule-tester';

testRule('prefer-effect-match', preferEffectMatch, {
  valid: `
    import * as Match from 'effect/Match'
    const render = Match.type<{ _tag: 'Found' } | { _tag: 'Missing' }>().pipe(
      Match.tagsExhaustive({ Found: () => 'found', Missing: () => 'missing' }),
    )
  `,
  invalid: `
    import * as Effect from 'effect/Effect'
    function render(value: { _tag: string }) {
      switch (value._tag) {
        case 'Found': return 'found'
        default: return 'missing'
      }
    }
  `,
  messageId: 'effectMatch',
});

for (const invalid of [
  'kind === "a" ? first : kind === "b" ? second : fallback;',
  '`a` !== kind ? first : `b` === kind ? second : fallback;',
  'kind == 1 ? first : kind != 2 ? second : kind === 3 ? third : fallback;',
]) {
  testRule('prefer-effect-match', preferEffectMatch, {
    valid: `
      kind === 'a' ? first : fallback;
      kind === 'a' ? first : other === 'b' ? second : fallback;
      condition ? first : otherCondition ? second : fallback;
      kind === dynamic ? first : kind === other ? second : fallback;
    `,
    invalid,
    messageId: 'preferMatch',
  });
}
