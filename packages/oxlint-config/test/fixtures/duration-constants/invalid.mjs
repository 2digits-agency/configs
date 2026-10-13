import * as Effect from 'effect/Effect';

export const TIMEOUT_MS = 5000;
export const sessionTimeoutSeconds = 30;
export const RETRY_BACKOFF = 250;
export const program = Effect.sleep(TIMEOUT_MS);
