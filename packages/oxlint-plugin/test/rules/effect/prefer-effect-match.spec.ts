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
