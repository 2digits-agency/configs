import { Diagnostic, RuleContext, type ESTree, type FixFn, type OxlintSourceCode } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';

import { isStringLiteral, propertyName, plainProperty } from './ast';
import { resolveVariable, usedNames } from './scope';

/**
 * A namespace import a fix can use: its local name, and the edit that adds it when the file lacks one.
 */
interface NamespaceImport {
  readonly name: string;
  readonly fix: Opt.Option<FixFn>;
}

function visibleNamespace(
  node: ESTree.Node,
  program: ESTree.Program,
  source: string,
): Effect.Effect<Opt.Option<string>, never, RuleContext> {
  const namespaces = Arr.flatMap(program.body, (statement) =>
    statement.type === 'ImportDeclaration' && statement.source.value === source && statement.importKind !== 'type'
      ? Arr.filter(
          statement.specifiers,
          (specifier): specifier is ESTree.ImportNamespaceSpecifier => specifier.type === 'ImportNamespaceSpecifier',
        )
      : [],
  );

  return Effect.map(
    Effect.filter(namespaces, (specifier) =>
      Effect.map(resolveVariable(node, specifier.local.name), (variable) =>
        Opt.exists(variable, ({ defs }) => Arr.some(defs, (definition) => definition.node === specifier)),
      ),
    ),
    (visible) => Opt.map(Arr.head(visible), (specifier) => specifier.local.name),
  );
}

function freeName(preferred: string, names: ReadonlySet<string>, suffix = 1): string {
  const name = suffix === 1 ? preferred : `${preferred}${suffix}`;

  return names.has(name) ? freeName(preferred, names, suffix + 1) : name;
}

function insertImport(program: ESTree.Program, text: string): FixFn {
  return Opt.match(
    Arr.findFirst(
      program.body,
      (statement) => statement.type !== 'ExpressionStatement' || !isStringLiteral(statement.expression),
    ),
    {
      onNone: () => Diagnostic.insertAfter(program, `\n${text}`),
      onSome:
        (first): FixFn =>
        (fixer) =>
          fixer.insertTextBefore(first, text),
    },
  );
}

/**
 * Reuse a visible namespace import of `source`, or add one under a collision-free alias.
 *
 * @param node Use site.
 * @param source Module entrypoint.
 * @param preferred Preferred local alias.
 */
export const namespaceImport = Effect.fn('namespaceImport')(function* (
  node: ESTree.Node,
  source: string,
  preferred: string,
) {
  const { sourceCode } = yield* RuleContext;

  const program = sourceCode.ast;

  const visible = yield* visibleNamespace(node, program, source);

  if (Opt.isSome(visible)) {
    return { name: visible.value, fix: Opt.none() } satisfies NamespaceImport;
  }

  const names = yield* usedNames;

  const name = freeName(preferred, names);

  return {
    name,
    fix: Opt.some(insertImport(program, `import * as ${name} from '${source}';\n`)),
  } satisfies NamespaceImport;
});

/**
 * Replace `node` with an expression that uses a namespace import of `source`, adding the import when the file lacks
 * one.
 *
 * @param node Node to replace.
 * @param source Module entrypoint.
 * @param preferred Preferred local alias.
 * @param replacement Replacement text for the alias the file ends up with.
 */
export const replaceWithNamespace = Effect.fn('replaceWithNamespace')(function* (
  node: ESTree.Node,
  source: string,
  preferred: string,
  replacement: (namespace: string) => string,
) {
  const imported = yield* namespaceImport(node, source, preferred);

  return Diagnostic.composeFixes(
    ...Opt.toArray(imported.fix),
    Diagnostic.replaceText(node, replacement(imported.name)),
  );
});

/**
 * The source text of an expression as a single call argument: a sequence such as `(a, b)` gets back the parentheses
 * that the AST leaves out of its range.
 *
 * @param sourceCode Source of the file.
 * @param node Expression.
 */
export function argumentText(sourceCode: OxlintSourceCode, node: ESTree.Node): string {
  const text = sourceCode.getText(node);

  return node.type === 'SequenceExpression' ? `(${text})` : text;
}

/**
 * Whether every member of an options object is a plain, uniquely named property other than `destination`, so its
 * properties can be moved safely.
 *
 * @param node Options object.
 * @param destination Property that must not exist.
 */
export function plainOptions(node: ESTree.ObjectExpression, destination: string): boolean {
  const names = Arr.map(node.properties, (property) =>
    plainProperty(property).pipe(
      Opt.filter((plain) => plain.key.type === 'Identifier' || plain.key.type === 'Literal'),
      Opt.flatMap((plain) => (plain.key.type === 'Literal' ? Opt.some(String(plain.key.value)) : propertyName(plain))),
    ),
  );

  const present = Arr.getSomes(names);

  return (
    present.length === names.length &&
    !Arr.contains(present, destination) &&
    Arr.dedupe(present).length === present.length
  );
}

/**
 * Attach a fix to a diagnostic when there is one.
 *
 * @param diagnostic Diagnostic to report.
 * @param fix Fix, or none when the code cannot be rewritten safely.
 */
export function withOptionalFix(diagnostic: Diagnostic.Diagnostic, fix: Opt.Option<FixFn>): Diagnostic.Diagnostic {
  return Opt.match(fix, { onNone: () => diagnostic, onSome: (fixFn) => Diagnostic.withFix(diagnostic, fixFn) });
}
