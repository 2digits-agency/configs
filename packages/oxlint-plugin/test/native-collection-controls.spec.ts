import * as Data from 'effect/Data';
import * as HashMap from 'effect/HashMap';
import * as HashSet from 'effect/HashSet';
import * as MutableHashMap from 'effect/MutableHashMap';
import * as Opt from 'effect/Option';
import { describe, expect, it } from 'vite-plus/test';

describe('native reference keys versus Effect v4 structural keys', () => {
  const key = { id: 7 };

  it.for([
    { kind: 'map', collection: new Map([[key, 'stored']]) },
    { kind: 'weak map', collection: new WeakMap([[key, 'stored']]) },
  ])('$kind lookups miss fresh equal-looking objects and hit the stored reference', ({ collection }) => {
    expect({
      freshGet: collection.get({ id: 7 }),
      freshHas: collection.has({ id: 7 }),
      freshDelete: collection.delete({ id: 7 }),
      stableGet: collection.get(key),
      stableHas: collection.has(key),
      stableDelete: collection.delete(key),
    }).toStrictEqual({
      freshGet: undefined,
      freshHas: false,
      freshDelete: false,
      stableGet: 'stored',
      stableHas: true,
      stableDelete: true,
    });
  });

  it.for([Set, WeakSet])(
    '%s membership misses fresh equal-looking arrays and hits the stored reference',
    (Collection) => {
      const key = [1, 3];
      const collection = new Collection([key]);

      expect({
        freshHas: collection.has([1, 3]),
        freshDelete: collection.delete([1, 3]),
        stableHas: collection.has(key),
        stableDelete: collection.delete(key),
      }).toStrictEqual({ freshHas: false, freshDelete: false, stableHas: true, stableDelete: true });
    },
  );

  it('effect v4 HashMap, MutableHashMap and HashSet accept fresh structural keys', () => {
    expect(HashMap.get(HashMap.make([{ id: 7 }, 'stored']), { id: 7 })).toStrictEqual(Opt.some('stored'));
    expect(MutableHashMap.get(MutableHashMap.make([{ id: 7 }, 'stored']), { id: 7 })).toStrictEqual(Opt.some('stored'));
    expect(HashSet.has(HashSet.make([1, 3]), [1, 3])).toBeTruthy();
  });

  it('data.Class is constructed, not a direct object/array literal', () => {
    class Key extends Data.Class<{ readonly id: number }> {}
    const key = new Key({ id: 7 });
    const map = new Map([[key, 'stored']]);

    expect(map.get(new Key({ id: 7 }))).toBeUndefined();
    expect(map.get(key)).toBe('stored');
    expect(HashMap.get(HashMap.make([key, 'stored']), new Key({ id: 7 }))).toStrictEqual(Opt.some('stored'));
  });
});
