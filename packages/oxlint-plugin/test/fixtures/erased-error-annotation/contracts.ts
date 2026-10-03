import * as Effect from 'effect/Effect';

export class ProfileError extends Error {
  readonly _tag = 'ProfileError';
}

function qrCode(text: string): Promise<string> {
  return Promise.reject(new Error(text));
}

export function annotated(): Effect.Effect<string, ProfileError> {
  return Effect.tryPromise({
    try: (_signal) => qrCode('barcode'),
    catch: (cause) => new ProfileError(String(cause)),
  }).pipe(Effect.orElseSucceed(() => ''));
}

export function ignored(): Effect.Effect<void, ProfileError> {
  return Effect.fail(new ProfileError('ignored')).pipe(Effect.ignore);
}

export function died(): Effect.Effect<never, ProfileError> {
  return Effect.fail(new ProfileError('defect')).pipe(Effect.orDie);
}

export function narrowed(): Effect.Effect<string, never> {
  return Effect.tryPromise({
    try: (_signal) => qrCode('barcode'),
    catch: (cause) => new ProfileError(String(cause)),
  }).pipe(Effect.orElseSucceed(() => ''));
}

// oxlint-disable-next-line 2digits/no-erased-error-annotation -- Preserve the public error contract for compatibility.
export function intentional(): Effect.Effect<string, ProfileError> {
  return Effect.tryPromise({
    try: (_signal) => qrCode('barcode'),
    catch: (cause) => new ProfileError(String(cause)),
  }).pipe(Effect.orElseSucceed(() => ''));
}
