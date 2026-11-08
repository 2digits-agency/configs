import type { Context, ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import type * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Str from 'effect/String';

import {
  containsRange,
  defineEffectRule,
  isApiPath,
  isFunctionNode,
  moduleExportName,
  ruleMeta,
  unwrapExpression,
  type FileState,
} from '../../utils';
import { isTypeGuard } from './forwarding';

interface Candidate {
  readonly declaration: ESTree.Node;
  // Type guards and generic functions, whose narrowing or inference inlining would lose.
  readonly typed: boolean;
  readonly name: ESTree.BindingIdentifier;
}

const defaultMaxLines = 3;

const maxLineWidth = 120;

const fnPath = ['Effect', 'fn' satisfies keyof typeof Effect];

/**
 * Whether a variable initializer is a function: an arrow or function expression, or `Effect.fn(body)`,
 * `Effect.fn('span')(body)` and `Effect.fn('span', options)(body, ...pipeables)`.
 *
 * @param node Variable initializer.
 * @param state Import bindings of the file.
 */
function isFunctionInitializer(node: ESTree.Expression, state: FileState): boolean {
  const expression = unwrapExpression(node);

  return (
    isFunctionNode(expression) ||
    (expression.type === 'CallExpression' &&
      (isApiPath(expression.callee, state, fnPath) ||
        (expression.callee.type === 'CallExpression' && isApiPath(expression.callee.callee, state, fnPath))))
  );
}

function candidates(
  statement: ESTree.Statement | ESTree.Directive | ESTree.ModuleDeclaration,
  state: FileState,
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

  if (statement.type !== 'VariableDeclaration') {
    return [];
  }

  const found: Array<Candidate> = [];

  for (const declarator of statement.declarations) {
    if (declarator.id.type !== 'Identifier' || !declarator.init || !isFunctionInitializer(declarator.init, state)) {
      continue;
    }

    const init = unwrapExpression(declarator.init);

    found.push({
      declaration: declarator,
      typed: isFunctionNode(init) && (isTypeGuard(init) || Boolean(init.typeParameters)),
      name: declarator.id,
    });
  }

  return found;
}

function locallyExportedNames(program: ESTree.Program): ReadonlySet<string> {
  const names = new Set<string>();

  for (const statement of program.body) {
    if (statement.type === 'ExportNamedDeclaration' && !statement.source) {
      for (const specifier of statement.specifiers) {
        names.add(moduleExportName(specifier.local));
      }
    }

    if (statement.type === 'ExportDefaultDeclaration' && statement.declaration.type === 'Identifier') {
      names.add(statement.declaration.name);
    }
  }

  return names;
}

function maxLines(context: Context): number {
  const [options] = context.options as ReadonlyArray<{ readonly maxLines?: number } | undefined>;

  return options?.maxLines ?? defaultMaxLines;
}

/**
 * Report module-private functions that are used once and short enough to read at their call site: by default, a
 * declaration of at most three lines.
 */
export const noSingleUsePrivateFunction: Rule = defineEffectRule(
  {
    ...ruleMeta('suggestion', 'Disallow short non-exported top-level functions that are used only once.', {
      singleUse:
        '`{{name}}` is only used once and not exported. Inline it where it is used instead of keeping a one-off helper.',
    }),
    schema: [
      {
        type: 'object',
        properties: {
          maxLines: { type: 'integer', minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
  },
  (context, getState) => ({
    Program(program) {
      if (Str.endsWith('.d.ts')(context.filename)) {
        return;
      }

      const limit = maxLines(context);

      const exported = locallyExportedNames(program);

      for (const statement of program.body) {
        for (const { declaration, typed, name } of candidates(statement, getState())) {
          const text = context.sourceCode.getText(declaration);

          // Components (PascalCase) and hooks (`useX`) stay named; the width limit keeps minified code out.
          if (
            typed ||
            exported.has(name.name) ||
            /^\p{Lu}|^use\p{Lu}/u.test(name.name) ||
            Str.split(text, '\n').length > limit ||
            text.length > limit * maxLineWidth
          ) {
            continue;
          }

          const references = Arr.findFirst(
            context.sourceCode.getDeclaredVariables(declaration),
            (variable) => variable.name === name.name,
          ).pipe(
            Opt.map((variable) => Arr.filter(variable.references, (reference) => !reference.init)),
            Opt.getOrElse(Arr.empty),
          );

          // A recursive function can't be inlined, and an unused one is left to `no-unused-vars`.
          if (
            references.length === 1 &&
            !Arr.some(references, (reference) => containsRange(declaration, reference.identifier))
          ) {
            context.report({ node: name, messageId: 'singleUse', data: { name: name.name } });
          }
        }
      }
    },
  }),
);
