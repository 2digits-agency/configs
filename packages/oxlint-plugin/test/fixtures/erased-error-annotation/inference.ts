import * as Effect from 'effect/Effect';

import { ProfileError } from './contracts';

export const unrecovered = Effect.tryPromise({
  try: (_signal): Promise<string> => Promise.reject(new Error('barcode')),
  catch: (cause) => new ProfileError(String(cause)),
});

export const recovered = unrecovered.pipe(Effect.orElseSucceed(() => ''));
export const ignored = unrecovered.pipe(Effect.ignore);
export const defect = new ProfileError('defect');
export const died = Effect.fail(defect).pipe(Effect.orDie);
