import { preferHoistedMatch } from '../../../src/rules/effect/prefer-hoisted-match';
import { testRule } from '../../rule-tester';

const valid = `
  import * as Match from 'effect/Match'
  import { pipe } from 'effect/Function'
  const render = Match.type<Shape>().pipe(Match.tagsExhaustive({ Circle: () => 'circle', Square: () => 'square' }))
  const renderTags = Match.typeTags<Shape>()({ Circle: () => 'circle', Square: () => 'square' })
  const parse = (input: Input, fallback: string) => Match.value(input).pipe(Match.orElse(() => fallback))
  const nested = (shape: Shape) => Match.value(shape.inner).pipe(Match.orElse(() => 'x'))
  function named(shape: Shape) { return Match.valueTags(shape, cases) }
  const local = (shape: Shape) => {
    const label = 'shape'
    return Match.value(shape).pipe(Match.orElse(() => label))
  }
  const method = function (shape: Shape) { return Match.value(shape).pipe(Match.orElse(() => this.fallback)) }
  const value = Match.value(input).pipe(Match.orElse(() => 'x'))
`;

for (const invalid of [
  `
    import * as Match from 'effect/Match'
    const render = (shape: Shape) => Match.value(shape).pipe(Match.tag('Circle', () => 'circle'), Match.orElse(() => 'other'))
  `,
  `
    import { Match, pipe } from 'effect'
    function render(shape: Shape): string {
      return pipe(Match.value(shape), Match.when({ kind: 'circle' }, () => 'circle'), Match.exhaustive)
    }
  `,
  `
    import * as M from 'effect/Match'
    items.map((item) => M.value(item).pipe(M.orElse(() => 'x')))
  `,
]) {
  testRule('prefer-hoisted-match', preferHoistedMatch, { valid, invalid, messageId: 'value' });
}

for (const invalid of [
  `
    import * as Match from 'effect/Match'
    export default function (shape: Shape) {
      return Match.valueTags(shape, { Circle: () => 'circle', Square: (square) => square.size })
    }
  `,
  `
    import * as Match from 'effect/Match'
    function render(shape: Shape) {
      return Match.valueTags(shape, { Circle: () => shape.radius, Square: () => 0 })
    }
  `,
  `
    import * as Match from 'effect/Match'
    items.map((item) => Match.valueTags(item, cases))
  `,
  `
    import * as Match from 'effect/Match'
    items.map((item) => Match.valueTags(cases)(item))
  `,
]) {
  testRule('prefer-hoisted-match', preferHoistedMatch, {
    // Named functions that only forward their parameter belong to `no-trivial-wrapper`.
    valid: `
      import * as Match from 'effect/Match'
      function render(shape: Shape) { return Match.valueTags(shape, cases) }
      const label = (shape: Shape) => Match.valueTags(shape, { Circle: () => 'circle', Square: () => 'square' })
      const area = (shape: Shape, scale: number) => Match.valueTags(shape, { Circle: () => scale, Square: () => 0 })
    `,
    invalid,
    messageId: 'valueTags',
  });
}
