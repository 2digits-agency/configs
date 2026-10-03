import * as Struct from 'effect/Struct';

export const result = Struct.evolve(
  { name: 'alice', zip: '00000' },
  { name: (value) => value.toUpperCase(), zipCode: () => '12345' },
);
