import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, objectProperty } from '../../internal/ast';
import { plainOptions, withOptionalFix } from '../../internal/fixes';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isImportedApi } from '../../internal/scope';

export const alchemyNoDeprecatedDockerConstraints: CreateRule = Rule.define({
  name: 'alchemy-no-deprecated-docker-constraints',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow the deprecated top-level Docker Service constraints property.',
    messages: {
      constraints: 'Docker.Service constraints is deprecated. Move it to placement: { constraints: ... }.',
    },
    url: 'https://alchemy.run/providers/docker/service',
    fixable: 'code',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    const report = Effect.fnUntraced(function* (
      node: ESTree.CallExpression,
      options: ESTree.ObjectExpression,
      constraints: ESTree.ObjectProperty,
    ) {
      const imported = yield* isImportedApi(node.callee);

      const fix = Opt.liftPredicate(
        Diagnostic.replaceText(constraints, `placement: { ${ctx.sourceCode.getText(constraints)} }`),
        () => imported && plainOptions(options, 'placement'),
      );

      yield* ctx.report(withOptionalFix(Diagnostic.fromId({ node: constraints, messageId: 'constraints' }), fix));
    });

    return Visitor.on('CallExpression', (node) => {
      if (!imports.isApi(node.callee, 'Docker', 'Service')) {
        return Effect.void;
      }

      const options = Opt.filter(
        argumentAt(node, 1),
        (argument): argument is ESTree.ObjectExpression => argument.type === 'ObjectExpression',
      );

      return Opt.match(
        Opt.flatMap(options, (object) =>
          Opt.map(objectProperty(object, 'constraints'), (constraints) => [object, constraints] as const),
        ),
        { onNone: () => Effect.void, onSome: ([object, constraints]) => report(node, object, constraints) },
      );
    });
  },
});
