import assert from 'node:assert/strict';

const packageName = process.argv[2];
const { default: metadata } = await import(`${packageName}/package.json`, { with: { type: 'json' } });
assert.equal(metadata.version, process.argv[3]);
const [Effect, Schema, SchemaGetter] =
  packageName === 'effect'
    ? await Promise.all([import('effect/Effect'), import('effect/Schema'), import('effect/SchemaGetter')])
    : await Promise.all([
        import('effect-rc117/Effect'),
        import('effect-rc117/Schema'),
        import('effect-rc117/SchemaGetter'),
      ]);
const results = [];

for (const [name, value] of [
  ['String', 'hello'],
  ['Number', 42],
  ['Boolean', true],
]) {
  const primitive = Schema[name];
  const options = {
    decode: SchemaGetter.withDefault(Effect.succeed(value)),
    encode: SchemaGetter.omit(),
  };
  const bad = Schema.Struct({ b: primitive.pipe(Schema.encodeTo(primitive, options)) });
  const good = Schema.Struct({ b: primitive.pipe(Schema.encodeTo(Schema.optionalKey(primitive), options)) });
  let missingKey;

  assert.throws(
    () => Schema.encodeSync(bad)({ b: value }),
    (error) => {
      assert.equal(error._tag, 'SchemaError');
      assert.equal(error.issue._tag, 'Composite');
      assert.equal(error.issue.issues.length, 1);
      const pointer = error.issue.issues[0];
      assert.equal(pointer._tag, 'Pointer');
      assert.equal(pointer.issue._tag, 'MissingKey');
      assert.deepEqual(pointer.path, ['b']);
      missingKey = pointer.path;
      return true;
    },
  );
  results.push({
    primitive: name,
    decoded: Schema.decodeUnknownSync(bad)({}),
    missingKey,
    optional: Schema.encodeSync(good)({ b: value }),
  });
}

console.log(JSON.stringify(results));
