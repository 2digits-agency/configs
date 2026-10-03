/* oxlint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
/* oxlint-disable 2digits/no-hash-as-identity -- Runtime collision controls intentionally use unsafe identity. */
/* eslint-disable unicorn/no-null -- RuleTester uses null to assert no autofix. */
import * as Eq from 'effect/Equal';
import * as Hash from 'effect/Hash';
import * as HashMap from 'effect/HashMap';
import * as Opt from 'effect/Option';
import { describe, expect, it } from 'vite-plus/test';

import { noHashAsIdentity } from '../../../src/rules/effect/no-hash-as-identity';
import { testRule } from '../../rule-tester';

const ruleName = 'no-hash-as-identity';
const messageId = 'hashIdentity';

testRule(ruleName, noHashAsIdentity, {
  valid: `
    import * as Hash from 'effect/Hash'
    function equals(a, b) {
      if (Hash.hash(a) !== Hash.hash(b)) return false
      return fullEquality(a, b)
    }
  `,
  invalid: `
    import * as Hash from 'effect/Hash'
    function equals(a, b) {
      if (Hash.hash(a) !== Hash.hash(b)) return false
      return true
    }
  `,
  messageId,
  output: null,
});

testRule(ruleName, noHashAsIdentity, {
  valid: `
    import * as Hash from 'effect/Hash'
    const key = Hash.hash(payload)
    function lookup(key: number) { return map.get(key) }
  `,
  invalid: `
    import * as Hash from 'effect/Hash'
    const key = Hash.hash(payload)
    map.get(key)
  `,
  messageId,
  output: null,
});

testRule(ruleName, noHashAsIdentity, {
  valid: `
    import * as HashMap from 'effect/HashMap'
    HashMap.set(cache, payload, result)
  `,
  invalid: `
    import * as Hash from 'effect/Hash'
    cache.set(Hash.hash(payload), result)
  `,
  messageId,
  output: null,
});

for (const [valid, invalid] of [
  [
    `import * as Hash from 'effect/Hash'; function f(Hash) { cache.get(Hash.hash(payload)) }`,
    `import { Hash as H } from 'effect'; cache.get(H.hash(payload))`,
  ],
  [
    `import * as Hash from 'other/Hash'; cache.get(Hash.hash(payload))`,
    `import { hash as h } from 'effect/Hash'; const key = h(payload); const alias = key; cache.get(alias)`,
  ],
  [
    `import * as Hash from 'effect/Hash'; const key = Hash.hash(payload); { const key = 42; cache.get(key) }`,
    `import * as Hash from 'effect/Hash'; const H = Hash; const h = H.hash; cache.get(h(payload))`,
  ],
  [
    `import * as Hash from 'effect/Hash'; let key = Hash.hash(payload); key = 42; cache.get(key)`,
    `import * as Hash from 'effect/Hash'; const key = Hash.hash(payload); function lookup() { return cache.get(key) }`,
  ],
  [
    `import * as Hash from 'effect/Hash'; let h = Hash.hash; h = customHash; cache.get(h(payload))`,
    `import * as Hash from 'effect/Hash'; const key = Hash.hash(payload); record[key] = result`,
  ],
  [
    `import type * as Hash from 'effect/Hash'; cache.get(Hash.hash(payload))`,
    `import * as Hash from 'effect/Hash'; function f() { const key = Hash.hash(payload); other.get(key) }`,
  ],
  [
    `import * as Hash from 'effect/Hash'; const key = Hash.hash(payload); function f(key) { new Map().get(key) }`,
    `import * as Hash from 'effect/Hash'; const key = Hash.hash(payload); new Map().get(key)`,
  ],
] satisfies Array<readonly [string, string]>) {
  testRule(ruleName, noHashAsIdentity, { valid, invalid, messageId, output: null });
}

testRule(ruleName, noHashAsIdentity, {
  valid: `
    import * as Hash from 'effect/Hash'
    import * as Equal from 'effect/Equal'
    const inBucket = (a, b) => Hash.hash(a) === Hash.hash(b) && Equal.equals(a, b)
  `,
  invalid: `
    import * as Hash from 'effect/Hash'
    import * as Equal from 'effect/Equal'
    const inBucket = (a, b) => Hash.hash(a) === Hash.hash(b) && Equal.equals(a, a)
  `,
  messageId,
  output: null,
});

const imports = `import * as Hash from 'effect/Hash'; import * as Equal from 'effect/Equal';`;

testRule(ruleName, noHashAsIdentity, {
  valid: `${imports}
    function compare(b, c) {
      var a = c
      const h = Hash.hash(a)
      if (h !== Hash.hash(b)) return false
      return Equal.equals(a, b)
    }
  `,
  invalid: `${imports}
    function compare(b, c) {
      var a = c
      const h = Hash.hash(a)
      var a = b
      if (h !== Hash.hash(b)) return false
      return Equal.equals(a, b)
    }
  `,
  messageId,
  output: null,
});

for (const [valid, invalid] of [
  [
    `if (Hash.hash(a) != Hash.hash(b)) { return false } return Equal.equals(b, a)`,
    `return Hash.hash(a) !== Hash.hash(b)`,
  ],
  [
    `const x = Hash.hash(a); const y = Hash.hash(b); if (x !== y) return false; return Equal.equals(a, b)`,
    `return Hash.hash(a) === Hash.hash(b)`,
  ],
  [
    `const eq = Equal.equals; return Hash.hash(a) == Hash.hash(b) && eq(b, a)`,
    `if (Hash.hash(a) !== Hash.hash(b)) return false; return unknownComparison(a, b)`,
  ],
  [
    `if (Hash.hash(a) !== Hash.hash(b)) return false; return Equal.equals(a, b)`,
    `if (Hash.hash(a) !== Hash.hash(b)) return false; return Equal.equals(a, c)`,
  ],
  [
    `return Hash.hash(a) === Hash.hash(b) && Equal.equals(b, a)`,
    `return Hash.hash(a) !== Hash.hash(b) && Equal.equals(a, b)`,
  ],
  [
    `return Hash.hash(a) === Hash.hash(b) && Equal.equals(a, b)`,
    `return Hash.hash(a) === Hash.hash(b) || Equal.equals(a, b)`,
  ],
  [
    `if (Hash.hash(a) !== Hash.hash(b)) return false; return Equal.equals(a, b)`,
    `if (Hash.hash(a) !== Hash.hash(b)) return false; if (condition) return Equal.equals(a, b); return true`,
  ],
  [
    `if (Hash.hash(a) !== Hash.hash(b)) return false; return Equal.equals(a, b)`,
    `if (Hash.hash(a) !== Hash.hash(b)) return false; a = c; return Equal.equals(a, b)`,
  ],
  [
    `return Hash.hash(a) === Hash.hash(b) && Equal.equals(a, b)`,
    `const Equal = { equals: () => true }; return Hash.hash(a) === Hash.hash(b) && Equal.equals(a, b)`,
  ],
  [
    `if (Hash.hash(a) !== Hash.hash(b)) return false; return fullEquality(a, b)`,
    `const fullEquality = () => true; if (Hash.hash(a) !== Hash.hash(b)) return false; return fullEquality(a, b)`,
  ],
  [
    `if (Hash.hash(a) !== Hash.hash(b)) return false; return Equal.equals(a, b)`,
    `if (condition) { if (Hash.hash(a) !== Hash.hash(b)) return false; return Equal.equals(a, b) } return true`,
  ],
] satisfies Array<readonly [string, string]>) {
  testRule(ruleName, noHashAsIdentity, {
    valid: `${imports} function compare(a, b, c) { ${valid} }`,
    invalid: `${imports} function compare(a, b, c) { ${invalid} }`,
    messageId,
    output: null,
  });
}

class Collision implements Eq.Equal {
  readonly id: string;
  readonly hash: number;

  constructor(id: string, hash = 17) {
    this.id = id;
    this.hash = hash;
  }

  [Hash.symbol](): number {
    return this.hash;
  }

  [Eq.symbol](that: Eq.Equal): boolean {
    return that instanceof Collision && this.id === that.id;
  }
}

function bucketEquals(a: Collision, b: Collision): boolean {
  if (Hash.hash(a) !== Hash.hash(b)) {
    return false;
  }

  return Eq.equals(a, b);
}

function inBucket(a: Collision, b: Collision): boolean {
  return Hash.hash(a) === Hash.hash(b) && Eq.equals(a, b);
}

describe('deterministic hash collisions', () => {
  const a = new Collision('first');
  const b = new Collision('second');
  const sameA = new Collision('first');
  const otherBucket = new Collision('third', 31);

  it('loses equality and inequality information with hash-only comparisons', () => {
    expect({
      leftHash: Hash.hash(a),
      rightHash: Hash.hash(b),
      equal: Eq.equals(a, b),
      hashEqual: Hash.hash(a) === Hash.hash(b),
      hashUnequal: Hash.hash(a) !== Hash.hash(b),
    }).toStrictEqual({ leftHash: 17, rightHash: 17, equal: false, hashEqual: true, hashUnequal: false });
  });

  it('distinguishes collisions, equivalent values, and different buckets with full equality', () => {
    expect([bucketEquals(a, b), bucketEquals(a, sameA), bucketEquals(a, otherBucket)]).toStrictEqual([
      false,
      true,
      false,
    ]);
    expect([a, b].filter((candidate) => inBucket(candidate, b))).toStrictEqual([b]);
  });

  it('overwrites numeric hash keys while HashMap preserves both payload keys', () => {
    const numericKeys = new Map([
      [Hash.hash(a), 'first'],
      [Hash.hash(b), 'second'],
    ]);

    expect(numericKeys.size).toBe(1);
    expect(numericKeys.get(Hash.hash(a))).toBe('second');

    const payloadKeys = HashMap.make([a, 'first'], [b, 'second']);

    expect(HashMap.size(payloadKeys)).toBe(2);
    expect(Opt.getOrThrow(HashMap.get(payloadKeys, sameA))).toBe('first');
    expect(Opt.getOrThrow(HashMap.get(payloadKeys, b))).toBe('second');
  });
});
