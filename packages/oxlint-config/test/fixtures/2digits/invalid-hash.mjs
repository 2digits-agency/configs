import * as Hash from 'effect/Hash';

const key = Hash.hash({ payload: true });
export const result = new Map().get(key);
export const equals = (a, b) => Hash.hash(a) === Hash.hash(b);
export const differs = (a, b) => Hash.hash(a) !== Hash.hash(b);
