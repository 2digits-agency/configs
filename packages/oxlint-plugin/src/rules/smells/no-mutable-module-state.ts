import { Diagnostic, Rule, RuleContext, Visitor } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { findAncestor, isAnyFunction, isConstDeclaration } from '../../internal/ast';
import { isTestFilename } from '../../internal/files';
import { ruleMeta } from '../../internal/meta';

/**
 * Report top-level `let` and `var` bindings that functions reassign.
 */
export const noMutableModuleState = Rule.define({
  name: 'no-mutable-module-state',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Disallow module-level `let` and `var` bindings, exported or not, that functions reassign.',
    messages: {
      mutableModuleState:
        'Module-level `{{name}}` is reassigned inside {{functions}}, so its value depends on which functions ran before and in what order. Give it one owner that controls every update, such as a `Ref` in a service, or derive the value where it is needed.',
    },
    url: 'https://github.com/K-Mistele/anti-slop/blob/main/src/martinfowler/rules/mutable-data.ts',
  }),
  *create() {
    const ctx = yield* RuleContext;

    if (isTestFilename(ctx.filename)) {
      return {};
    }

    return Visitor.on('Program', (program) => {
      const declarators = Arr.flatMap(program.body, (statement) => {
        const declaration = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement;

        return declaration?.type === 'VariableDeclaration' && !isConstDeclaration(declaration)
          ? declaration.declarations
          : [];
      });

      const reports = Arr.flatMap(declarators, (declarator) =>
        Arr.flatMap(ctx.sourceCode.getDeclaredVariables(declarator), (variable) => {
          const writers = Arr.dedupeWith(
            Arr.getSomes(
              Arr.map(
                Arr.filter(variable.references, (reference) => reference.isWrite() && !reference.init),
                ({ identifier }) => findAncestor(identifier, isAnyFunction),
              ),
            ),
            (left, right) => left === right,
          );

          return Arr.isArrayNonEmpty(writers)
            ? Opt.toArray(
                Opt.map(Arr.head(variable.identifiers), (identifier) => ({
                  identifier,
                  name: variable.name,
                  functions: writers.length === 1 ? '1 function' : `${writers.length} functions`,
                })),
              )
            : [];
        }),
      );

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      return Effect.forEach(
        reports,
        ({ identifier, name, functions }) =>
          ctx.report(
            Diagnostic.fromId({ node: identifier, messageId: 'mutableModuleState', data: { name, functions } }),
          ),
        { concurrency: 1, discard: true },
      );
    });
  },
});
