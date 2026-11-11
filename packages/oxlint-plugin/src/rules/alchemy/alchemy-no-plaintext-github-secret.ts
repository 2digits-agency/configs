import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { argumentAt, isStringLiteral, objectProperty, staticPath, unwrapExpression } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

function isPlaintextSecret(node: ESTree.Expression, imports: ImportBindings): boolean {
  const value = unwrapExpression(node);

  return (
    isStringLiteral(value) ||
    value.type === 'TemplateLiteral' ||
    Opt.exists(staticPath(value), ([root, member]) => root === 'process' && member === 'env') ||
    // Effect v3 name, which the current Effect types no longer export (v4 has `Config.String`).
    (value.type === 'CallExpression' && imports.isApi(value.callee, 'Config', 'string'))
  );
}

export const alchemyNoPlaintextGithubSecret = Rule.define({
  name: 'alchemy-no-plaintext-github-secret',
  meta: ruleMeta({
    type: 'problem',
    description: 'Require singular GitHub Secret values to use Redacted.',
    messages: {
      plaintext:
        'GitHub.Secret value must be Redacted so it stays out of logs and state. Use Redacted.make(...) or Config.redacted(...).',
    },
    url: 'https://alchemy.run/providers/github/secret',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      argumentAt(node, 1).pipe(
        Opt.filter(() => imports.isApi(node.callee, 'GitHub', 'Secret')),
        Opt.filter((options): options is ESTree.ObjectExpression => options.type === 'ObjectExpression'),
        Opt.flatMap(objectProperty('value')),
        Opt.map(({ value }) => value),
        Opt.filter((value) => isPlaintextSecret(value, imports)),
        Opt.match({
          onNone: () => Effect.void,
          onSome: (value) => ctx.report(Diagnostic.fromId({ node: value, messageId: 'plaintext' })),
        }),
      ),
    );
  },
});
