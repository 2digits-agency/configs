import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import ts from 'typescript';

import { createRule } from '../utils';

type MessageId = 'clientValueImport' | 'indirectClientValueImport';

export const RULE_NAME = 'no-client-value-import-in-server';

interface ClientValueImport {
  readonly binding: ts.Identifier;
  readonly source: string;
}

export const noClientValueImportInServer = createRule<[], MessageId>({
  name: RULE_NAME,
  meta: {
    type: 'problem',
    docs: {
      description:
        "Disallow importing values from 'use client' modules into 'use server' and 'server-only' modules, where they are client references",
    },
    schema: [],
    messages: {
      clientValueImport:
        "'{{name}}' comes from the 'use client' module '{{source}}', so on the server it is a client reference instead of the value. Move it to a module without 'use client', or use `import type` if you only need its type.",
      indirectClientValueImport:
        "'{{source}}' imports '{{name}}' from the 'use client' module '{{clientSource}}', so on the server it is a client reference instead of the value. Move '{{name}}' to a module without 'use client'.",
    },
    defaultOptions: [],
  },
  create(context) {
    const parserServices = ESLintUtils.getParserServices(context, true);

    const { program } = parserServices;

    if (!program) {
      return {};
    }

    const checker = program.getTypeChecker();

    return {
      Program(node) {
        if (!isServerModule(node)) {
          return;
        }

        for (const statement of node.body) {
          if (statement.type !== AST_NODE_TYPES.ImportDeclaration || statement.importKind === 'type') {
            continue;
          }

          const declaration = parserServices.esTreeNodeToTSNodeMap.get(statement);

          const direct = findClientValueImports(checker, declaration);

          for (const { binding, source } of direct) {
            context.report({
              node: parserServices.tsNodeToESTreeNodeMap.get(binding),
              messageId: 'clientValueImport',
              data: { name: binding.text, source },
            });
          }

          if (direct.length > 0) {
            continue;
          }

          const indirect = findIndirectClientValueImport(checker, declaration);

          if (indirect !== undefined) {
            context.report({
              node: statement.source,
              messageId: 'indirectClientValueImport',
              data: { name: indirect.binding.text, source: statement.source.value, clientSource: indirect.source },
            });
          }
        }
      },
    };
  },
});

function isServerModule(program: TSESTree.Program): boolean {
  return program.body.some(
    (statement) =>
      (statement.type === AST_NODE_TYPES.ExpressionStatement && statement.directive === 'use server') ||
      (statement.type === AST_NODE_TYPES.ImportDeclaration &&
        statement.source.value === 'server-only' &&
        statement.specifiers.length === 0),
  );
}

/**
 * The value bindings of an import whose module, or the module that declares the binding, starts with 'use client'.
 * Barrels without a directive are followed to the declaring module.
 *
 * @param checker Type checker of the program that contains the import.
 * @param declaration Import declaration to check.
 */
function findClientValueImports(checker: ts.TypeChecker, declaration: ts.ImportDeclaration): Array<ClientValueImport> {
  const { importClause, moduleSpecifier } = declaration;

  if (
    importClause === undefined ||
    importClause.phaseModifier === ts.SyntaxKind.TypeKeyword ||
    !ts.isStringLiteral(moduleSpecifier)
  ) {
    return [];
  }

  const moduleIsClient = hasDirective(resolveModule(checker, moduleSpecifier), 'use client');

  return valueBindings(importClause)
    .filter((binding) => {
      const symbol = checker.getSymbolAtLocation(binding);

      if (symbol === undefined) {
        return moduleIsClient;
      }

      const target = symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;

      if (!(target.flags & ts.SymbolFlags.Value)) {
        return false;
      }

      return moduleIsClient || hasDirective(target.declarations?.at(0)?.getSourceFile(), 'use client');
    })
    .map((binding) => ({ binding, source: moduleSpecifier.text }));
}

/**
 * A client value imported by a plain TypeScript module that this import loads, such as a Zod schema file shared by a
 * server action and its form. Only one level is checked, and `.tsx` modules are skipped because a server component may
 * render the client components it imports.
 *
 * @param checker Type checker of the program that contains the import.
 * @param declaration Import declaration of the server module.
 */
function findIndirectClientValueImport(
  checker: ts.TypeChecker,
  declaration: ts.ImportDeclaration,
): ClientValueImport | undefined {
  const { moduleSpecifier } = declaration;

  const sourceFile = ts.isStringLiteral(moduleSpecifier) ? resolveModule(checker, moduleSpecifier) : undefined;

  if (
    sourceFile === undefined ||
    sourceFile.isDeclarationFile ||
    sourceFile.fileName.endsWith('.tsx') ||
    hasDirective(sourceFile, 'use client') ||
    hasDirective(sourceFile, 'use server')
  ) {
    return undefined;
  }

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) {
      continue;
    }

    const [first] = findClientValueImports(checker, statement);

    if (first !== undefined) {
      return first;
    }
  }

  return undefined;
}

function valueBindings(importClause: ts.ImportClause): Array<ts.Identifier> {
  const { name, namedBindings } = importClause;

  const bindings = name === undefined ? [] : [name];

  if (namedBindings === undefined) {
    return bindings;
  }

  if (ts.isNamespaceImport(namedBindings)) {
    return [...bindings, namedBindings.name];
  }

  return [
    ...bindings,
    ...namedBindings.elements.filter((element) => !element.isTypeOnly).map((element) => element.name),
  ];
}

function resolveModule(checker: ts.TypeChecker, moduleSpecifier: ts.StringLiteral): ts.SourceFile | undefined {
  const declaration = checker.getSymbolAtLocation(moduleSpecifier)?.valueDeclaration;

  return declaration !== undefined && ts.isSourceFile(declaration) ? declaration : undefined;
}

function hasDirective(sourceFile: ts.SourceFile | undefined, directive: string): boolean {
  const statements = sourceFile?.statements ?? [];

  for (const statement of statements) {
    if (!ts.isExpressionStatement(statement) || !ts.isStringLiteral(statement.expression)) {
      return false;
    }

    if (statement.expression.text === directive) {
      return true;
    }
  }

  return false;
}
