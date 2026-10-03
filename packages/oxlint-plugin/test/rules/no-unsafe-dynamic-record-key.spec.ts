/* oxlint-disable unicorn/no-null -- RuleTester requires null to assert that no fix is offered. */
/* eslint-disable unicorn/no-null, sonar/no-duplicate-string -- Keep RuleTester no-fix assertions and syntax fixtures explicit. */
import { RuleTester } from 'oxlint/plugins-dev';
import { describe, expect, it } from 'vite-plus/test';

import { recommendedRules, rules } from '../../src';
import { testRule } from '../rule-tester';

testRule('no-unsafe-dynamic-record-key', rules['no-unsafe-dynamic-record-key'], {
  valid: `const vat: Record<string, string> = { DE: '7.4' }; function lookup(key: 'DE' | 'NL') { return vat[key] ?? '6'; }`,
  invalid: `const vat: Record<string, string> = { DE: '7.4' }; function lookup(key: string) { return vat[key] ?? '6'; }`,
  messageId: 'unsafeRead',
  output: null,
});

for (const contract of [
  'Readonly<Record<string, number>>',
  '{ readonly [key: string]: number }',
  'Dictionary<number>',
]) {
  testRule('no-unsafe-dynamic-record-key', rules['no-unsafe-dynamic-record-key'], {
    valid: `type Dictionary<T> = Record<'DE' | 'NL', T>; const result: ${contract} = Object.fromEntries([]); function lookup(key: string) { return result[key] ?? 0; }`,
    invalid: `type Dictionary<T> = Record<string, T>; const result: ${contract} = {}; function lookup(input: string) { const key = input.trim().toLowerCase(); return result[key] ?? 0; }`,
    messageId: 'unsafeRead',
    output: null,
  });
}

for (const operation of [
  'result[key] = value',
  'result[key] += value',
  'result[key]++',
  '[result[key]] = [value]',
  '({ value: result[key] } = { value })',
  '[result[key] = value] = []',
  '[...result[key]] = [value]',
  'for (result[key] of [value]) {}',
  'for (result[key] in { value }) {}',
]) {
  testRule('no-unsafe-dynamic-record-key', rules['no-unsafe-dynamic-record-key'], {
    valid: `function copy(key: string, value: number) { const result: Record<string, number> = Object.create(null); ${operation}; }`,
    invalid: `function copy(key: string, value: number) { const result: Record<string, number> = {}; ${operation}; }`,
    messageId: 'unsafeWrite',
    output: null,
  });
}

for (const operation of [
  'key in result',
  'result[key] === undefined',
  'undefined !== result[key]',
  'result[key] == void 0',
]) {
  testRule('no-unsafe-dynamic-record-key', rules['no-unsafe-dynamic-record-key'], {
    valid: `function lookup(key: string) { const result = {}; return ${operation}; }`,
    invalid: `function lookup(key: string) { const result: Record<string, number> = {}; return ${operation}; }`,
    messageId: 'unsafeRead',
    output: null,
  });
}

for (const loop of [
  'for (const [key, value] of Object.entries(input)) { result[key] = value; }',
  'Object.entries(input).forEach(([key, value]) => { result[key] = value; });',
]) {
  testRule('no-unsafe-dynamic-record-key', rules['no-unsafe-dynamic-record-key'], {
    valid: `function copy(input: Record<'name' | 'age', number>) { const result: Record<string, number> = {}; ${loop} }`,
    invalid: `function copy(input: Record<string, number>) { const result: Record<string, number> = {}; ${loop} }`,
    messageId: 'unsafeWrite',
    output: null,
  });
}

for (const body of [
  'if (Object.hasOwn(result, key)) { return result[key] ?? 0; }',
  'return Object.hasOwn(result, key) ? result[key] ?? 0 : 0;',
  'return Object.hasOwn(result, key) && (result[key] ?? 0);',
  'if (!Object.hasOwn(result, key)) return 0; return result[key] ?? 0;',
  'if (Object.prototype.hasOwnProperty.call(result, key)) return result[key] ?? 0;',
]) {
  testRule('no-unsafe-dynamic-record-key', rules['no-unsafe-dynamic-record-key'], {
    valid: `function lookup(key: string) { const result: Record<string, number> = {}; ${body} }`,
    invalid: `function copy(key: string) { const result: Record<string, number> = {}; if (Object.hasOwn(result, key)) result[key] = 1; }`,
    messageId: 'unsafeWrite',
    output: null,
  });
}

for (const guard of ["['name', 'age'].includes(key)", "key === 'name' || key === 'age'"]) {
  testRule('no-unsafe-dynamic-record-key', rules['no-unsafe-dynamic-record-key'], {
    valid: `function copy(key: string) { const result: Record<string, number> = {}; if (${guard}) result[key] = 1; }`,
    invalid: `function lookup(key: string, other: string) { const result: Record<string, number> = {}; if (Object.hasOwn(result, other)) return result[key] ?? 0; }`,
    messageId: 'unsafeRead',
    output: null,
  });
}

const tester = new RuleTester({ languageOptions: { parserOptions: { lang: 'ts' }, sourceType: 'module' } });

tester.run('bounded dictionary proof', rules['no-unsafe-dynamic-record-key'], {
  valid: [
    `function read(key: string, result: Record<string, number>) { return result[key] ?? 0; }`,
    `const result: Record<string, number> = {}; function read(key: string) { const result = new Map(); return result[key] ?? 0; }`,
    `function read(key: string) { const result: Record<string, number> = new Dictionary(); return result[key] ?? 0; }`,
    `function read(key: string) { const result: Record<string, number> = { __proto__: null }; return result[key] ?? 0; }`,
    `function read(key: string) { const result: Record<'name' | 'age', number> = {}; return result[key] ?? 0; }`,
    `type Record<K, V> = { name: V }; function read(key: string) { const result: Record<string, number> = {}; return result[key] ?? 0; }`,
    `import type { Record } from 'other'; function read(key: string) { const result: Record<string, number> = {}; return result[key] ?? 0; }`,
    `function read<Record>(key: string) { const result: Record<string, number> = {}; return result[key] ?? 0; }`,
    `function read(key: string) { let result: Record<string, number> = {}; result = Object.create(null); return result[key] ?? 0; }`,
    `function read(key: string) { const result: Record<string, number> = {}; key = 'name'; return result[key] ?? 0; }`,
    `function read(key: string) { const result: Record<string, number> = {}; { const key = 'name'; return result[key] ?? 0; } }`,
    `function read(key: unknown) { const result: Record<string, number> = {}; return result[key] ?? 0; }`,
    `function read(key: string, undefined: number) { const result: Record<string, number> = {}; return result[key] === undefined; }`,
    `function read(key: string) { const result: Record<string, number> = {}; return result[key]; }`,
    `function read(key: string) { const result: Record<string, number> = {}; return result['constructor'] ?? 0; }`,
    `function read(key: string) { const result: Record<string, number> = {}; return result['field:' + key] ?? 0; }`,
    `function read(key: string) { const result: Record<string, number> = {}; return result[\`field:\${key}\`] ?? 0; }`,
    `function read(key: number) { const result: Record<string, number> = {}; return result[String(key)] ?? 0; }`,
    `function read(key: string) { const result: Record<string, number> = {}; return result[key.toUpperCase()] ?? 0; }`,
    `function copy(Object: any, input: Record<string, number>) { const result: Record<string, number> = {}; for (const [key, value] of Object.entries(input)) result[key] = value; }`,
    `function copy() { const input: Record<string, number> = { age: 42 }; const result: Record<string, number> = {}; for (const [key, value] of Object.entries(input)) result[key] = value; }`,
    `function read(key: string) { const result: Record<string, number> = {}; const allowed = ['name', 'age'] as const; if (allowed.includes(key)) return result[key] ?? 0; }`,
  ].map((code) => ({ code, filename: 'valid.ts' })),
  invalid: [
    `function read(key: string, Object: any) { const result: Record<string, number> = {}; if (Object.hasOwn(result, key)) return result[key] ?? 0; }`,
    `function read(key: string) { const result: Record<string, number> = {}; if (!Object.hasOwn(result, key)) return result[key] ?? 0; }`,
    `function read(key: string, other: Record<string, number>) { const result: Record<string, number> = {}; if (Object.hasOwn(other, key)) return result[key] ?? 0; }`,
    `function read(key: string) { const result: Record<string, number> = {}; if (['constructor', 'toString', '__proto__'].includes(key)) return result[key] ?? 0; }`,
    `function read(key: string) { const result: Record<string, number> = {}; if (Object.hasOwn(result, key) || key.length) return result[key] ?? 0; }`,
  ].map((code) => ({ code, filename: 'invalid.ts', errors: [{ messageId: 'unsafeRead' }], output: null })),
});

tester.run('alias and nullable VAT reads', rules['no-unsafe-dynamic-record-key'], {
  valid: [
    {
      filename: 'valid.ts',
      code: `const aliases: Readonly<Record<string, string>> = {}; function handles(value: 'blue' | 'red') { const alias = aliases[value]; return alias === undefined ? [value] : [value, alias]; }`,
    },
  ],
  invalid: [
    {
      filename: 'alias.ts',
      code: `const aliases: Readonly<Record<string, string>> = {};
function handles(input: string) {
  const value = input.trim().toLowerCase();
  const alias = aliases[value];
  return alias === undefined ? [value] : [value, alias];
}`,
      errors: [{ messageId: 'unsafeRead', line: 4, column: 16, endColumn: 30 }],
      output: null,
    },
    {
      filename: 'vat.ts',
      code: `const vat: Readonly<Record<string, string>> = { DE: '7.4' };
function lookup(country: string | null | undefined) {
  if (country !== undefined && country !== null && country !== 'NL') {
    return vat[country] ?? '6';
  }
}`,
      errors: [{ messageId: 'unsafeRead', line: 4, column: 11, endColumn: 23 }],
      output: null,
    },
  ],
});

tester.run('own proto properties versus prototype setters', rules['no-unsafe-dynamic-record-key'], {
  valid: [
    `function copy(key: string) { const result: Record<string, unknown> = { __proto__() {} }; result[key] = {}; }`,
    `function copy(key: string) { const result: Record<string, unknown> = { ['__proto__']: 0 }; result[key] = {}; }`,
    `function read(key: string) { const result: Record<string, unknown> = {}; const values = { value: result[key] }; [other = result[key]] = []; }`,
  ].map((code) => ({ code, filename: 'valid.ts' })),
  invalid: [
    `function read(key: string) { const result: Record<string, unknown> = { __proto__() {} }; return result[key] ?? 0; }`,
    `function read(key: string) { const result: Record<string, unknown> = { get __proto__() { return 0; } }; return key in result; }`,
  ].map((code) => ({ code, filename: 'invalid.ts', errors: [{ messageId: 'unsafeRead' }], output: null })),
});

function inheritedFallback(key: string): unknown {
  const aliases: Record<string, unknown> = {};

  return aliases[key] ?? 'fallback';
}

tester.run('copy and merge operations', rules['no-unsafe-dynamic-record-key'], {
  valid: [
    {
      filename: 'valid.ts',
      code: `function merge(left: Record<string, unknown>, right: Record<string, unknown>) {
  return Object.fromEntries([...Object.entries(left), ...Object.entries(right)]);
}`,
    },
  ],
  invalid: [
    {
      filename: 'merge.ts',
      code: `function merge(query: Record<string, unknown>, payload: Record<string, unknown>) {
  const merged: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(query)) {
    merged[key] = value;
  }
  for (const [key, value] of Object.entries(payload)) {
    merged[key] = value;
  }
  return merged;
}`,
      errors: [
        { messageId: 'unsafeWrite', line: 4, column: 4, endColumn: 15 },
        { messageId: 'unsafeWrite', line: 7, column: 4, endColumn: 15 },
      ],
      output: null,
    },
  ],
});

tester.run('mutable whitelist contents', rules['no-unsafe-dynamic-record-key'], {
  valid: [
    {
      filename: 'valid.ts',
      code: `function copy(key: string) { const result: Record<string, unknown> = {}; const allowed = ['name']; if (allowed.includes(key)) result[key] = {}; }`,
    },
  ],
  invalid: ['allowed.push("__proto__")', 'allowed[0] = "__proto__"', 'mutate(allowed)'].map((mutation) => ({
    filename: 'invalid.ts',
    code: `function copy(key: string) { const result: Record<string, unknown> = {}; const allowed = ['name']; ${mutation}; if (allowed.includes(key)) result[key] = {}; }`,
    errors: [{ messageId: 'unsafeWrite' }],
    output: null,
  })),
});

tester.run('own-key guards invalidated by deletion', rules['no-unsafe-dynamic-record-key'], {
  valid: [
    `function read(key: string) { const result: Record<string, unknown> = { constructor: 1 }; delete result[key]; if (Object.hasOwn(result, key)) return result[key] ?? 0; }`,
    `function read(key: string) { const result: Record<string, unknown> = { constructor: 1 }; if (Object.hasOwn(result, key)) { delete result.other; return result[key] ?? 0; } }`,
  ].map((code) => ({ code, filename: 'valid.ts' })),
  invalid: [
    `function read(key: string) { const result: Record<string, unknown> = { constructor: 1 }; if (Object.hasOwn(result, key)) { delete result[key]; return result[key] ?? 0; } }`,
    `function read(key: string) { const result: Record<string, unknown> = { constructor: 1 }; return Object.hasOwn(result, key) && (delete result.constructor, result[key] ?? 0); }`,
  ].map((code) => ({ code, filename: 'invalid.ts', errors: [{ messageId: 'unsafeRead' }], output: null })),
});

tester.run('computed open entry sources', rules['no-unsafe-dynamic-record-key'], {
  valid: [
    {
      filename: 'valid.ts',
      code: `function copy(input: 'name') { const source: Record<string, unknown> = { [input]: {} }; const result: Record<string, unknown> = {}; for (const [key, value] of Object.entries(source)) result[key] = value; }`,
    },
  ],
  invalid: [
    {
      filename: 'invalid.ts',
      code: `function copy(input: string) { const source: Record<string, unknown> = { [input]: {} }; const result: Record<string, unknown> = {}; for (const [key, value] of Object.entries(source)) result[key] = value; }`,
      errors: [{ messageId: 'unsafeWrite' }],
      output: null,
    },
  ],
});

tester.run('open dictionary spreads', rules['no-unsafe-dynamic-record-key'], {
  valid: [
    {
      filename: 'valid.ts',
      code: `function copy(input: Record<'name', number>) { const source: Record<string, number> = { ...input }; const result: Record<string, number> = {}; for (const [key, value] of Object.entries(source)) result[key] = value; }`,
    },
  ],
  invalid: [
    {
      filename: 'invalid.ts',
      code: `function copy(input: Record<string, number>) { const source: Record<string, number> = { ...input }; const result: Record<string, number> = {}; for (const [key, value] of Object.entries(source)) result[key] = value; }`,
      errors: [{ messageId: 'unsafeWrite' }],
      output: null,
    },
  ],
});

describe('dictionary alternatives', () => {
  it('distinguishes an own proto method from an inherited prototype setter', () => {
    const dictionary: Record<string, unknown> = { __proto__() {} };
    const value = { marker: 42 };
    const key = '__proto__';

    dictionary[key] = value;
    expect(Object.getPrototypeOf(dictionary)).toBe(Object.prototype);
    expect(Object.hasOwn(dictionary, key)).toBeTruthy();
    expect(dictionary[key]).toBe(value);
    expect(dictionary.constructor).toBe(Object);
  });

  it.for([
    { key: 'ordinary', own: true, prototype: Object.prototype, fallback: 'fallback' },
    { key: 'constructor', own: true, prototype: Object.prototype, fallback: Object },
    { key: 'toString', own: true, prototype: Object.prototype, fallback: Object.prototype.toString },
    { key: '__proto__', own: false, prototype: { marker: 42 }, fallback: Object.prototype },
  ])('preserves own $key fields without mutating the prototype', ({ key, own, prototype, fallback }) => {
    const value = { marker: 42 };
    const input = JSON.parse(`{"${key}":{"marker":42}}`) as Record<string, unknown>;
    const plain: Record<string, unknown> = {};
    const safe = Object.create(null) as Record<string, unknown>;

    for (const [name, entry] of Object.entries(input)) {
      plain[name] = entry;
      safe[name] = entry;
    }
    expect({
      value: safe[key],
      own: Object.hasOwn(safe, key),
      prototype: Object.getPrototypeOf(safe) as unknown,
    }).toStrictEqual({
      value,
      own: true,
      prototype: null,
    });
    expect({ own: Object.hasOwn(plain, key), prototype: Object.getPrototypeOf(plain) as unknown }).toStrictEqual({
      own,
      prototype,
    });
    expect(Object.hasOwn({}, key)).toBeFalsy();
    expect(inheritedFallback(key)).toBe(fallback);
  });

  it('registers a diagnostic-only, opt-in rule', () => {
    expect(recommendedRules['2digits/no-unsafe-dynamic-record-key']).toBeUndefined();
    expect(rules['no-unsafe-dynamic-record-key'].meta?.fixable).toBeUndefined();
    expect(rules['no-unsafe-dynamic-record-key'].meta?.hasSuggestions).toBeFalsy();
  });
});
