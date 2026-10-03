/* oxlint-disable unicorn/no-null -- RuleTester uses null for no-fix assertions. */
/* eslint-disable unicorn/no-null -- Explicit lookup boundaries and no-fix assertions. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, it } from 'vite-plus/test';

import { noFreshNativeCollectionLookupKey } from '../../src/rules/no-fresh-native-collection-lookup-key';

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

const tester = new RuleTester({
  languageOptions: {
    parserOptions: { lang: 'ts' },
    sourceType: 'module',
    globals: { Map: 'readonly', Set: 'readonly', WeakMap: 'readonly', WeakSet: 'readonly' },
  },
});

tester.run('no-fresh-native-collection-lookup-key', noFreshNativeCollectionLookupKey, {
  valid: [
    'const key = { id: 1 }; const map = new Map([[key, "stored"]]); map.get(key);',
    'const map = new Map(); map.get({ ...key });',
    'const map = new Map(); map.has({ [field]: 1 });',
    'const map = new Map(); map.delete({ [Equal.symbol]() { return true } });',
    'const map = new Map(); map.get({ __proto__: protocol });',
    'const map = new Map(); map.get({ get id() { return 1 } });',
    'const set = new Set(); set.has([...keys]);',
    'const map = new Map(); map.get = customGet; map.get({ id: 1 });',
    'Map = CustomMap; const map = new Map(); map.get({ id: 1 });',
    'const map = new Map(); map.get(1); map.has("key"); map.delete(null); map.get(undefined);',
    'const map = new Map(); map.set({ id: 1 }, []); const set = new Set(); set.add([]);',
    'const map = new Map(); const key = [1, 2]; map.get(key);',
    'const map = new Map(); map.get(new Key({ id: 1 })); map.get(makeKey());',
    'const map = new Map(); map.get(...keys); map.get(); map[method]({ id: 1 });',
    'const set = new Set(); set.get({ id: 1 });',
    'const set = new WeakSet(); set.get([]);',
    'const map = customCollection(); map.get({ id: 1 });',
    'const map = { get(key) { return key.id } }; map.get({ id: 1 });',
    'function f(map) { map.get({ id: 1 }); }',
    'import { map } from "./cache"; map.get({ id: 1 });',
    'const map = new CustomMap(); map.get({ id: 1 });',
    'const map = new globalThis.Map(); map.get({ id: 1 });',
    'const map = new Map(); const alias = map; alias.get({ id: 1 });',
    'const { map } = new Map(); map.get({ id: 1 });',
    'let map = new Map(); map = customCollection(); map.get({ id: 1 });',
    'const map = new Map(); function f(map) { map.get({ id: 1 }); }',
    'const map = new Map(); { const map = customCollection(); map.has([]); }',
    'function f(Map) { const map = new Map(); map.get({ id: 1 }); }',
    'import { Map } from "./collections"; const map = new Map(); map.get([]);',
    'const Map = CustomMap; const map = new Map(); map.get([]);',
    'const map = new Map(); class Map {} map.get({ id: 1 });',
    'const map = new Map(); function f() { map = customCollection(); } map.get([]);',
    'const map = new Map(); delete map.get; map.get([]);',
    'const map = new Map(); map["get"] = customGet; map.get([]);',
    'import * as HashMap from "effect/HashMap"; HashMap.get(HashMap.make([{ id: 1 }, "stored"]), { id: 1 });',
    'import * as MutableHashMap from "effect/MutableHashMap"; MutableHashMap.get(MutableHashMap.make([{ id: 1 }, "stored"]), { id: 1 });',
    'import * as HashSet from "effect/HashSet"; HashSet.has(HashSet.make([1, 2]), [1, 2]);',
    'import * as Cache from "effect/Cache"; Cache.get(cache, { id: 1 });',
    'import * as Atom from "effect/unstable/reactivity/Atom"; const family = Atom.family(make); family({ id: 1 });',
    'import * as Data from "effect/Data"; class Key extends Data.Class {} const map = new Map(); map.get(new Key({ id: 1 }));',
  ],
  invalid: [
    {
      code: 'const map = new Map([[{ id: 1 }, "stored"]]); map.get({ id: 1 });',
      errors: [{ messageId: 'freshKey' }],
      output: null,
    },
    ...['Map', 'Set', 'WeakMap', 'WeakSet'].flatMap((constructor) =>
      (constructor.endsWith('Map') ? ['get', 'has', 'delete'] : ['has', 'delete']).flatMap((method) =>
        ['{ id: 7 }', '[1, 3]'].map((key) => ({
          code: `const collection = new ${constructor}(); collection.${method}(${key});`,
          errors: [{ messageId: 'freshKey' }],
          output: null,
        })),
      ),
    ),
    {
      code: 'const map = new Map(); function f(Map) { map.get({ id: 1 }); }',
      errors: [{ messageId: 'freshKey' }],
      output: null,
    },
    {
      code: 'const map = customCollection(); { const map = new Map(); map["get"]([]); }',
      errors: [{ messageId: 'freshKey' }],
      output: null,
    },
    {
      code: 'let map = new Map(); map?.get?.({});',
      errors: [{ messageId: 'freshKey' }],
      output: null,
    },
    {
      code: 'const map = new Map(); function f() { return map.get([]) }',
      errors: [{ messageId: 'freshKey' }],
      output: null,
    },
  ],
});
