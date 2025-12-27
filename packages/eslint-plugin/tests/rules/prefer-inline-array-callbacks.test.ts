import parser from '@typescript-eslint/parser';
import { run, type InvalidTestCase, type ValidTestCase } from 'eslint-vitest-rule-tester';

import { preferInlineArrayCallbacks, RULE_NAME } from '../../src/rules/prefer-inline-array-callbacks';

const typescript = String.raw;

const valids: Array<ValidTestCase> = [
  typescript`const arr = [1, 2, 3]; arr.map((x) => x * 2)`,
  typescript`const arr = [1, 2, 3]; arr.map((x) => fn(x))`,
  typescript`const arr = [1, 2, 3]; arr.filter((x) => predicate(x))`,
  typescript`const arr = [1, 2, 3]; arr.forEach((x) => { process(x); })`,
  typescript`const arr = [1, 2, 3]; arr.reduce((acc, x) => acc + x, 0)`,

  typescript`const arr = [1, 2, 3]; arr.filter(Boolean)`,
  typescript`const arr = [1, 2, 3]; arr.find(Boolean)`,
  typescript`const arr = [1, 2, 3]; arr.findIndex(Boolean)`,
  typescript`const arr = [1, 2, 3]; arr.some(Boolean)`,
  typescript`const arr = [1, 2, 3]; arr.every(Boolean)`,

  typescript`const arr = ['a', 'b']; arr.map(String)`,
  typescript`const arr = ['1', '2']; arr.map(Number)`,
  typescript`const arr = [1n, 2n]; arr.map(BigInt)`,
  typescript`const arr = [true, false]; arr.map(Symbol)`,

  typescript`const arr = [1, 2, 3]; arr.map(fn.bind(this))`,
  typescript`const arr = [1, 2, 3]; arr.filter(predicate.bind(ctx))`,

  typescript`const arr = [1, 2, 3]; arr['map'](fn)`,
  typescript`const method = 'map'; arr[method](fn)`,

  typescript`const arr = [1, 2, 3]; arr.map()`,
  typescript`const arr = [1, 2, 3]; arr.map(fn, ctx, extra)`,

  typescript`class MyArray { map(fn: Function) {} }; const arr = new MyArray(); arr.map(fn)`,
  typescript`const obj = { map: (fn: Function) => {} }; obj.map(fn)`,

  typescript`const promise = Promise.resolve([1, 2, 3]); promise.then(fn)`,
  typescript`const set = new Set([1, 2, 3]); set.forEach(fn)`,

  typescript`const arr = [1, 2, 3]; arr?.map((x) => x * 2)`,
];

const invalids: Array<InvalidTestCase> = [
  {
    code: typescript`const arr = [1, 2, 3]; arr.map(fn)`,
    output: typescript`const arr = [1, 2, 3]; arr.map((element) => fn(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'fn', method: 'map' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.filter(predicate)`,
    output: typescript`const arr = [1, 2, 3]; arr.filter((element) => predicate(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'predicate', method: 'filter' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.forEach(process)`,
    output: typescript`const arr = [1, 2, 3]; arr.forEach((element) => { process(element); })`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'process', method: 'forEach' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.reduce(reducer)`,
    output: typescript`const arr = [1, 2, 3]; arr.reduce((acc, element) => reducer(acc, element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'reducer', method: 'reduce' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.reduceRight(reducer)`,
    output: typescript`const arr = [1, 2, 3]; arr.reduceRight((acc, element) => reducer(acc, element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'reducer', method: 'reduceRight' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.find(predicate)`,
    output: typescript`const arr = [1, 2, 3]; arr.find((element) => predicate(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'predicate', method: 'find' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.findLast(predicate)`,
    output: typescript`const arr = [1, 2, 3]; arr.findLast((element) => predicate(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'predicate', method: 'findLast' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.findIndex(predicate)`,
    output: typescript`const arr = [1, 2, 3]; arr.findIndex((element) => predicate(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'predicate', method: 'findIndex' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.findLastIndex(predicate)`,
    output: typescript`const arr = [1, 2, 3]; arr.findLastIndex((element) => predicate(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'predicate', method: 'findLastIndex' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.some(predicate)`,
    output: typescript`const arr = [1, 2, 3]; arr.some((element) => predicate(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'predicate', method: 'some' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.every(predicate)`,
    output: typescript`const arr = [1, 2, 3]; arr.every((element) => predicate(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'predicate', method: 'every' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.flatMap(transform)`,
    output: typescript`const arr = [1, 2, 3]; arr.flatMap((element) => transform(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'transform', method: 'flatMap' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.map(obj.method)`,
    output: typescript`const arr = [1, 2, 3]; arr.map((element) => obj.method(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'method', method: 'map' } }],
  },
  {
    code: typescript`const tuple: [number, number] = [1, 2]; tuple.map(fn)`,
    output: typescript`const tuple: [number, number] = [1, 2]; tuple.map((element) => fn(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'fn', method: 'map' } }],
  },
  {
    code: typescript`const arr: Array<number> | Array<string> = [1, 2]; arr.map(fn)`,
    output: typescript`const arr: Array<number> | Array<string> = [1, 2]; arr.map((element) => fn(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'fn', method: 'map' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.map(a || b)`,
    output: typescript`const arr = [1, 2, 3]; arr.map((element) => (a || b)(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'callback', method: 'map' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.map(condition ? fnA : fnB)`,
    output: typescript`const arr = [1, 2, 3]; arr.map((element) => (condition ? fnA : fnB)(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'callback', method: 'map' } }],
  },
  {
    code: typescript`const Boolean = (x) => x > 0; [0, 1, -1].filter(Boolean)`,
    output: typescript`const Boolean = (x) => x > 0; [0, 1, -1].filter((element) => Boolean(element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'Boolean', method: 'filter' } }],
  },
  {
    code: typescript`const arr = [1, 2, 3]; arr.map(obj['method'])`,
    output: typescript`const arr = [1, 2, 3]; arr.map((element) => obj['method'](element))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'method', method: 'map' } }],
  },
  {
    code: typescript`const arr = [3, 1, 2]; arr.toSorted(compareFn)`,
    output: typescript`const arr = [3, 1, 2]; arr.toSorted((a, b) => compareFn(a, b))`,
    errors: [{ messageId: 'noCallbackReference', data: { name: 'compareFn', method: 'toSorted' } }],
  },
];

await run({
  parser,
  parserOptions: {
    projectService: {
      allowDefaultProject: ['*.ts'],
    },
  },
  name: RULE_NAME,
  rule: preferInlineArrayCallbacks,
  valid: valids,
  invalid: invalids,
});
