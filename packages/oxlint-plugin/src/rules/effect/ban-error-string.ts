import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { argumentAt, isErrorConstructor, isSomeSame, parentOfType, staticPath } from '../../internal/ast';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';

const ErrorLikeName = Schema.Literals(['error', 'err', 'e', 'cause', 'exception', 'ex']);

const isErrorLikeName = Schema.is(ErrorLikeName);

function errorLikeName(node: ESTree.Node | null | undefined): Opt.Option<string> {
  return node?.type === 'Identifier' && isErrorLikeName(node.name) ? Opt.some(node.name) : Opt.none();
}

/**
 * `String(x)` or `globalThis.String(x)` with exactly one argument.
 *
 * @param node Expression.
 */
function isStringCall(node: ESTree.CallExpression): boolean {
  return (
    node.arguments.length === 1 &&
    Opt.exists(staticPath(node.callee), (path) => Arr.lastNonEmpty(path) === 'String' && path.length <= 2)
  );
}

/**
 * Whether a `String(x)` call is the message of an error construction, which the `NewExpression` visitor reports.
 *
 * @param node `String(x)` call.
 */
function isErrorMessage(node: ESTree.CallExpression): boolean {
  return Opt.exists(
    parentOfType(node, 'NewExpression'),
    (construction) =>
      isSomeSame<ESTree.Node>(Arr.head(construction.arguments), node) && isErrorConstructor(construction),
  );
}

/**
 * The error-like name a call stringifies: `String(error)` outside an error construction, or `error.toString()`.
 *
 * @param node Call.
 */
function stringifiedName(node: ESTree.CallExpression): Opt.Option<string> {
  if (isStringCall(node)) {
    return isErrorMessage(node) ? Opt.none() : Opt.flatMap(Arr.head(node.arguments), errorLikeName);
  }

  return node.callee.type === 'MemberExpression' &&
    Arr.isReadonlyArrayEmpty(node.arguments) &&
    Opt.exists(staticPath(node.callee), (path) => Arr.lastNonEmpty(path) === 'toString')
    ? errorLikeName(node.callee.object)
    : Opt.none();
}

/**
 * The name a template literal stringifies when it is exactly `` `${error}` ``.
 *
 * @param node Template literal.
 */
function interpolatedName(node: ESTree.TemplateLiteral): Opt.Option<string> {
  const [first, last] = node.quasis;

  return node.quasis.length === 2 && first?.value.raw === '' && last?.value.raw === ''
    ? Opt.flatMap(Arr.head(node.expressions), errorLikeName)
    : Opt.none();
}

export const banErrorString: CreateRule = defineRule({
  name: 'ban-error-string',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow string coercion that discards an error value’s stack, type, and cause chain.',
    messages: {
      errorString: 'Do not stringify {{name}}. Preserve the original error as an Error cause instead.',
      useCause: 'Replace {{pattern}} with {{replacement}} to preserve the original error.',
    },
    hasSuggestions: true,
  }),
  *create() {
    const ctx = yield* RuleContext;

    function reportName(node: ESTree.Node, name: Opt.Option<string>) {
      return Opt.match(name, {
        onNone: () => Effect.void,
        onSome: (value) => ctx.report(Diagnostic.fromId({ node, messageId: 'errorString', data: { name: value } })),
      });
    }

    /**
     * Report `new Error(String(cause))` with a suggestion to pass the cause instead.
     *
     * @param message `String(cause)` call.
     * @param causeArgument Stringified value.
     */
    function reportMessage(message: ESTree.CallExpression, causeArgument: ESTree.Expression) {
      const cause = ctx.sourceCode.getText(causeArgument);

      const replacement = `'Error occurred', { cause: ${cause} }`;

      return ctx.report(
        Diagnostic.withSuggestions(
          Diagnostic.fromId({ node: message, messageId: 'errorString', data: { name: cause } }),
          [
            {
              messageId: 'useCause',
              data: { pattern: ctx.sourceCode.getText(message), replacement },
              fix: Diagnostic.replaceText(message, replacement),
            },
          ],
        ),
      );
    }

    return Visitor.merge(
      Visitor.on('NewExpression', (node) =>
        Opt.match(
          Opt.filter(
            argumentAt(node, 0),
            (first): first is ESTree.CallExpression =>
              first.type === 'CallExpression' && isStringCall(first) && isErrorConstructor(node),
          ),
          {
            onNone: () => Effect.void,
            onSome: (message) =>
              Opt.match(argumentAt(message, 0), {
                onNone: () => Effect.void,
                onSome: (cause) => reportMessage(message, cause),
              }),
          },
        ),
      ),
      Visitor.on('CallExpression', (node) => reportName(node, stringifiedName(node))),
      Visitor.on('TemplateLiteral', (node) => reportName(node, interpolatedName(node))),
    );
  },
});
