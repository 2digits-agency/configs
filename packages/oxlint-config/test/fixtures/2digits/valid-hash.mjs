import * as Equal from 'effect/Equal';
import * as Hash from 'effect/Hash';

export function equals(a, b) {
  if (Hash.hash(a) !== Hash.hash(b)) return false;
  return Equal.equals(a, b);
}

const key = Hash.hash({ payload: true });
export function lookup(key) {
  return new Map().get(key);
}

export const inBucket = (a, b) => Hash.hash(a) === Hash.hash(b) && Equal.equals(a, b);
export { key };
