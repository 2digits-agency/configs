import * as Fn from 'effect/Function';
import * as Struct from 'effect/Struct';

export const model = { name: 'alice', zip: '00000' };

// An overlapping extracted updater bypasses fresh-literal excess-property checking.
const stale = { name: (value: string) => value.toUpperCase(), zipCode: (_value: string) => '12345' };
const correct = { name: (value: string) => value.toUpperCase(), zip: (_value: string) => '12345' };

export const staleResults = [
  Struct.evolve(model, stale),
  Struct.evolve(stale)(model),
  Fn.pipe(model, Struct.evolve(stale)),
];

export const correctResults = [
  Struct.evolve(model, correct),
  Struct.evolve(correct)(model),
  Fn.pipe(model, Struct.evolve(correct)),
];
