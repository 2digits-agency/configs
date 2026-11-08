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

for (const invalid of [
  `
    import * as Effect from 'effect/Effect'
    function render(order: Order) {
      if (order.disposition === 'ship') return ship(order)
      else if (order.disposition === 'hold') return hold(order)
      else return cancel(order)
    }
  `,
  `
    import * as Effect from 'effect/Effect'
    if ('a' === value.kind) { first() } else if (value.kind !== \`b\`) { second() }
  `,
]) {
  testRule('prefer-effect-match', preferEffectMatch, {
    valid: `
      import * as Effect from 'effect/Effect'
      if (order.disposition === 'ship') ship(order)
      if (order.disposition === 'ship') ship(order); else hold(order)
      if (order.disposition === 'ship') ship(order); else if (order.status === 'held') hold(order)
      if (order.disposition === 'ship') ship(order); else if (isHeld(order)) hold(order)
      if (order.disposition === 'ship') ship(order); else { if (order.disposition === 'hold') hold(order) }
      const value = order.disposition === 'ship' ? 1 : 2
    `,
    invalid,
    messageId: 'ifChain',
  });
}

testRule('prefer-effect-match', preferEffectMatch, {
  valid: "if (kind === 'a') first(); else if (kind === 'b') second();",
  invalid: "import { Effect } from 'effect'; if (kind === 'a') first(); else if (kind === 'b') second();",
  messageId: 'ifChain',
});
