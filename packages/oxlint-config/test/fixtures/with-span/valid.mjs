import * as Fx from 'effect/Effect';
import { useSpan as trace } from 'effect/Effect';

Fx.useSpan('underscore', (_span) => annotate(_span));
Fx.useSpan('destructured', ({ spanId }) => recordId(spanId));
trace('shorthand', {}, (span) => Fx.succeed({ span }));
Fx.useSpan('captured', (span) => () => annotate(span));
Fx.useSpan('non-inline', callback);
Fx.useSpan('default', (span = fallback()) => program);

export function shadowed(Fx) {
  return Fx.useSpan('shadowed', () => program);
}

// oxlint-disable-next-line 2digits/prefer-with-span -- Deliberately retain standalone span parenting.
Fx.useSpan('standalone', () => program);
