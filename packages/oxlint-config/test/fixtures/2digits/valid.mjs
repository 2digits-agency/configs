import * as Effect from 'effect/Effect';

export const guarded = Effect.map(Effect.succeed('{'), (raw) => {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
});

export const typed = Effect.andThen(Effect.succeed('{'), (raw) =>
  Effect.try({ try: () => JSON.parse(raw), catch: (cause) => ({ cause }) }),
);

export const deferred = Effect.map(Effect.succeed('{'), (raw) => () => JSON.parse(raw));

// oxlint-disable-next-line 2digits/no-throw-in-effect-callback -- Intentional defect injection requires explicit suppression.
export const deliberate = Effect.map(Effect.succeed('{'), JSON.parse);
