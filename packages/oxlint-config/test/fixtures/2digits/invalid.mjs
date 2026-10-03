import * as Schema from 'effect/Schema';

export const AnyObject = Schema.Struct({});

// Syntax-only lint controls; invalid argument typing is left to the compiler.
Schema.Struct({}, record);
Schema.Struct({}, ...records);
Schema.Struct(...args);
function shadowed(Schema) {
  return Schema.Struct({});
}
