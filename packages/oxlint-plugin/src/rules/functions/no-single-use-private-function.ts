import { Diagnostic, Rule, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';
import * as Str from 'effect/String';

import { containsRange, isFunctionNode, moduleExportName, unwrapExpression } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isTypeGuard } from './internal/forwarding';

interface Candidate {
  readonly declaration: ESTree.Node;
  // Type guards and generic functions, whose narrowing or inference inlining would lose.
  readonly typed: boolean;
  readonly name: ESTree.BindingIdentifier;
}

const defaultMaxLines = 3;

const maxLineWidth = 120;

const fnPath = ['Effect', 'fn' satisfies keyof typeof Effect];

// Components (PascalCase) and hooks (`useX`) stay named.
const isComponentOrHook = Schema.is(Schema.String.check(Schema.isPattern(/^\p{Lu}|^use\p{Lu}/u)));

const Options = Schema.Struct({
  maxLines: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)).pipe(Schema.optionalKey),
});

/**
 * Whether a variable initializer is a function: an arrow or function expression, or `Effect.fn(body)`,
 * `Effect.fn('span')(body)` and `Effect.fn('span', options)(body, ...pipeables)`.
 *
 * @param node Variable initializer.
 * @param imports Import bindings of the file.
 */
function isFunctionInitializer(node: ESTree.Expression, imports: ImportBindings): boolean {
  const expression = unwrapExpression(node);

  return (
    isFunctionNode(expression) ||
    (expression.type === 'CallExpression' &&
      (imports.isApiPath(expression.callee, fnPath) ||
        (expression.callee.type === 'CallExpression' && imports.isApiPath(expression.callee.callee, fnPath))))
  );
}

function candidates(
  statement: ESTree.Statement | ESTree.Directive | ESTree.ModuleDeclaration,
  imports: ImportBindings,
): ReadonlyArray<Candidate> {
  if (statement.type === 'FunctionDeclaration' && statement.id && statement.body) {
    return [
      {
        declaration: statement,
        typed: isTypeGuard(statement) || Boolean(statement.typeParameters),
        name: statement.id,
      },
    ];
  }

  return statement.type === 'VariableDeclaration'
    ? Arr.flatMap(statement.declarations, (declarator) => {
        if (
          declarator.id.type !== 'Identifier' ||
          !declarator.init ||
          !isFunctionInitializer(declarator.init, imports)
        ) {
          return [];
        }

        const init = unwrapExpression(declarator.init);

        return [
          {
            declaration: declarator,
            typed: isFunctionNode(init) && (isTypeGuard(init) || Boolean(init.typeParameters)),
            name: declarator.id,
          },
        ];
      })
    : [];
}

function locallyExportedNames(program: ESTree.Program): ReadonlyArray<string> {
  return Arr.flatMap(program.body, (statement) => {
    if (statement.type === 'ExportNamedDeclaration' && !statement.source) {
      return Arr.map(statement.specifiers, (specifier) => moduleExportName(specifier.local));
    }

    return statement.type === 'ExportDefaultDeclaration' && statement.declaration.type === 'Identifier'
      ? [statement.declaration.name]
      : [];
  });
}

/**
 * Report module-private functions that are used once and short enough to read at their call site: by default, a
 * declaration of at most three lines.
 */
export const noSingleUsePrivateFunction: CreateRule = Rule.define({
  name: 'no-single-use-private-function',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow short non-exported top-level functions that are used only once.',
    messages: {
      singleUse:
        '`{{name}}` is only used once and not exported. Inline it where it is used instead of keeping a one-off helper.',
    },
    // Oxlint validates the options against this JSON Schema; the Effect Schema decodes them.
    schema: [
      {
        type: 'object',
        properties: {
          maxLines: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ maxLines: defaultMaxLines }],
  }),
  options: Options.pipe(Schema.UndefinedOr),
  *create(options) {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (Str.endsWith('.d.ts')(ctx.filename)) {
      return {};
    }

    const { sourceCode } = ctx;

    const limit = options?.maxLines ?? defaultMaxLines;

    /**
     * Whether a candidate is short, private, and referenced exactly once outside its own declaration. A recursive
     * function can't be inlined, and an unused one is left to `no-unused-vars`. The width limit keeps minified code
     * out.
     *
     * @param candidate Top-level function.
     * @param exported Names the module exports.
     */
    function isSingleUse(candidate: Candidate, exported: ReadonlyArray<string>) {
      const { declaration, typed, name } = candidate;

      const text = sourceCode.getText(declaration);

      if (
        typed ||
        Arr.contains(exported, name.name) ||
        isComponentOrHook(name.name) ||
        Str.split(text, '\n').length > limit ||
        text.length > limit * maxLineWidth
      ) {
        return false;
      }

      const references = Arr.findFirst(
        sourceCode.getDeclaredVariables(declaration),
        (variable) => variable.name === name.name,
      ).pipe(
        Opt.map((variable) => Arr.filter(variable.references, (reference) => !reference.init)),
        Opt.getOrElse(Arr.empty),
      );

      return (
        references.length === 1 &&
        !Arr.some(references, (reference) => containsRange(declaration, reference.identifier))
      );
    }

    return Visitor.on('Program', (program) => {
      const exported = locallyExportedNames(program);

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      return Effect.forEach(
        Arr.filter(
          Arr.flatMap(program.body, (statement) => candidates(statement, imports)),
          (candidate) => isSingleUse(candidate, exported),
        ),
        ({ name }) => ctx.report(Diagnostic.fromId({ node: name, messageId: 'singleUse', data: { name: name.name } })),
        { discard: true },
      );
    });
  },
});
