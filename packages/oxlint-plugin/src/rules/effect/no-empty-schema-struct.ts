import { Diagnostic, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import type * as Schema from 'effect/Schema';

import { argumentAt } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

export const noEmptySchemaStruct: CreateRule = defineRule({
  name: 'no-empty-schema-struct',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow Schema.Struct({}), which accepts every non-null object-like value.',
    messages: {
      emptyStruct: 'Schema.Struct({}) does not validate an exact empty object. Define the intended fields explicitly.',
    },
    url: 'https://github.com/Effect-TS/tsgo/issues/403',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      imports.isApi(node.callee, 'Schema', 'Struct' satisfies keyof typeof Schema) &&
      Opt.exists(
        argumentAt(node, 0),
        (fields) => fields.type === 'ObjectExpression' && Arr.isReadonlyArrayEmpty(fields.properties),
      )
        ? ctx.report(Diagnostic.fromId({ node, messageId: 'emptyStruct' }))
        : Effect.void,
    );
  },
});
