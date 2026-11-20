import { Diagnostic, Rule, RuleContext, type ESTree } from 'effect-oxlint';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as R from 'effect/Record';

import { moduleExportName } from '../../internal/ast';
import { importBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { isTypeOnlyImport } from './internal/import-style';
import { importMemberUses, onRuntimeImport, packageName } from './internal/package-imports';

/**
 * The `diff` (jsdiff) exports that `TextDiff` replaces. Word, sentence, CSS and JSON diffs, and parsing or applying
 * patch text, have no `TextDiff` counterpart and stay allowed.
 */
const jsdiffReplacements: Readonly<Record<string, string>> = {
  createPatch: 'TextDiff.unified',
  createTwoFilesPatch: 'TextDiff.unified',
  diffArrays: 'TextDiff.diff',
  diffChars: 'TextDiff.codePoints',
  diffLines: 'TextDiff.lines',
  formatPatch: 'TextDiff.unified',
  structuredPatch: 'TextDiff.hunks',
};

/**
 * Diff packages that `TextDiff` replaces as a whole.
 */
const diffPackages: Readonly<Record<string, string>> = {
  'diff-sequences': 'TextDiff.diffWith',
  'fast-diff': 'TextDiff.codePoints',
};

export const preferEffectTextDiff = Rule.define({
  name: 'prefer-effect-text-diff',
  meta: ruleMeta({
    type: 'suggestion',
    description: 'Prefer Effect TextDiff over third-party text diff packages in Effect projects.',
    messages: {
      textDiff:
        'Use {{replacement}} from effect instead of {{api}}: TextDiff diffs lines and code points, groups them into hunks and formats unified diffs.',
    },
    url: 'https://effect.website/docs/v4/api/effect/TextDiff',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function report(node: ESTree.Node, api: string, replacement: string) {
      return ctx.report(Diagnostic.fromId({ node, messageId: 'textDiff', data: { api, replacement } }));
    }

    function reportJsdiff(node: ESTree.Node, source: string, name: string) {
      return Opt.match(R.get(jsdiffReplacements, name), {
        onNone: () => Effect.void,
        onSome: (replacement) => report(node, `${source} ${name}`, replacement),
      });
    }

    // `diffLines` imported by name, or `Diff.diffLines` through a default or namespace import.
    function reportJsdiffSpecifier(
      declaration: ESTree.ImportDeclaration,
      specifier: ESTree.ImportDeclaration['specifiers'][number],
    ) {
      const source = declaration.source.value;

      if (specifier.type === 'ImportSpecifier') {
        return isTypeOnlyImport(declaration, specifier)
          ? Effect.void
          : reportJsdiff(specifier, source, moduleExportName(specifier.imported));
      }

      // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
      return Effect.forEach(
        importMemberUses(ctx.sourceCode, specifier),
        ([member, name]) => reportJsdiff(member, source, name),
        { concurrency: 1, discard: true },
      );
    }

    return onRuntimeImport((source, declaration) => {
      const name = packageName(source.value);

      if (name !== 'diff') {
        return Opt.match(R.get(diffPackages, name), {
          onNone: () => Effect.void,
          onSome: (replacement) => report(source, source.value, replacement),
        });
      }

      return Opt.match(declaration, {
        onNone: () => Effect.void,
        onSome: (node) =>
          // oxlint-disable-next-line unicorn/no-array-for-each -- Effect.forEach is not Array#forEach.
          Effect.forEach(node.specifiers, (specifier) => reportJsdiffSpecifier(node, specifier), {
            concurrency: 1,
            discard: true,
          }),
      });
    });
  },
});
