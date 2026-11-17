import { rules } from '../../../src';
import { testRule } from '../../rule-tester';

const valid = `
  const Ready = Schema.TaggedStruct('Ready', { value: Schema.String });
  type Ready = typeof Ready.Type;
  type Event = Data.TaggedEnum<{ Ready: { readonly value: string } }>;
  type Value = { readonly tag: 'Ready' };
  type ValueTag = Value['_tag'];
  const tagOf = <A extends { readonly _tag: string }>(value: A) => value._tag;
  interface Tagged<TTag extends string> { readonly _tag: TTag }
  type Loose = { readonly _tag: 'Ready' | string };
  declare module 'external' { interface Node { readonly _tag: 'Leaf' } }
  declare global { interface Window { readonly _tag: 'Browser' } }
  type Refund = Extract<Payment, { _tag: 'Refund' }>;
  type Open = Exclude<Payment, { readonly _tag: 'Refund' } | { readonly _tag: 'Void' }>;
`;

for (const invalid of [
  `type Value = { readonly _tag: 'Ready'; readonly payload: string };`,
  `interface Value { readonly '_tag': 'Ready' }`,
  `type Value = { ['_tag']: 'Ready' };`,
  `type Value = { readonly _tag: ('Ready' | 'Done') };`,
  `const handle = (event: { readonly _tag?: 'Ready' }) => event;`,
  `const tagOf = <A extends { readonly _tag: 'Ready' }>(value: A) => value;`,
  `namespace Domain { export interface Value { readonly _tag: 'Ready' } }`,
  `type Values = Array<{ readonly _tag: 'Ready' }>;`,
  `type Value = Extract<{ readonly _tag: 'Ready' }, Payment>;`,
  `type Values = Record<string, { readonly _tag: 'Ready' }>;`,
]) {
  testRule('no-manual-tagged-type', rules['no-manual-tagged-type'], { valid, invalid, messageId: 'manualTaggedType' });
}

testRule('no-manual-tagged-type', rules['no-manual-tagged-type'], {
  valid: `export interface Value { readonly _tag: 'Ready' }`,
  validFilename: 'external.d.mts',
  invalid: `export interface Value { readonly _tag: 'Ready' }`,
  invalidFilename: 'value.mts',
  messageId: 'manualTaggedType',
});
