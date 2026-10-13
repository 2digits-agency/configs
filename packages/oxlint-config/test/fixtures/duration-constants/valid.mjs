import * as Duration from 'effect/Duration';
import * as Effect from 'effect/Effect';

export const TIMEOUT = Duration.seconds(5);
export const MAX_RETRIES = 3;
export const program = Effect.sleep(TIMEOUT);
