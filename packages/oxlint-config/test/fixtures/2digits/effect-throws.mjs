import * as Effect from 'effect/Effect';

export const handled = Effect.map(source, (value) => {
  try {
    throw value;
  } catch (caught) {
    return caught;
  }
});

export const escaping = Effect.map(source, () => {
  throw 'escaping';
});
