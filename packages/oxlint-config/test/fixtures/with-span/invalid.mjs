import * as Fx from 'effect/Effect';
import { useSpan as trace } from 'effect/Effect';

Fx.useSpan('absent', () => program);
Fx.useSpan('object-key', (span) => Fx.succeed({ span: 1 }));
trace('underscore', {}, (_span) => program);
Fx.useSpan('shadowed-handle', (span) => (span) => annotate(span));
