import type { ESTree, Rule } from '@oxlint/plugins';
import * as Arr from 'effect/Array';
import * as Str from 'effect/String';

import { defineSyntaxRule, isGlobalIdentifier, ruleMeta } from '../../utils';

const domainFile =
  /\.(?:aggregate|api|command|context|event|external|id|middleware|model|policy|projection|rejection|saga|stream|view)\.[cm]?tsx?$/u;

const domainPackage = '@alchemy.run/domain';

function isAllowed(source: string): boolean {
  return (
    Str.startsWith('.')(source) ||
    source === 'effect' ||
    Str.startsWith('effect/')(source) ||
    source === domainPackage ||
    Str.startsWith(`${domainPackage}/`)(source)
  );
}

function importsDomain(program: ESTree.Program): boolean {
  return Arr.some(
    program.body,
    (statement) => statement.type === 'ImportDeclaration' && statement.source.value === domainPackage,
  );
}

export const alchemyDomainPureImports: Rule = defineSyntaxRule(
  ruleMeta(
    'problem',
    'Restrict Alchemy Domain block files to imports from `@alchemy.run/domain`, `effect` and the domain package itself.',
    {
      import:
        'A domain block imports only `@alchemy.run/domain`, `effect` and relative files, not `{{source}}`. Put code that touches infrastructure in the server package.',
      dynamic:
        'A domain block imports only `@alchemy.run/domain`, `effect` and relative files, so its import sources must be string literals.',
    },
    'https://alchemy.run/domain',
  ),
  (context) => {
    let checked = false;

    function check(node: ESTree.ImportDeclaration | ESTree.ExportAllDeclaration | ESTree.ExportNamedDeclaration): void {
      if (checked && node.source !== null && !isAllowed(node.source.value)) {
        context.report({ node: node.source, messageId: 'import', data: { source: node.source.value } });
      }
    }

    function checkSource(source: ESTree.Node): void {
      if (!checked) {
        return;
      }

      if (source.type !== 'Literal' || typeof source.value !== 'string') {
        context.report({ node: source, messageId: 'dynamic' });
      } else if (!isAllowed(source.value)) {
        context.report({ node: source, messageId: 'import', data: { source: source.value } });
      }
    }

    return {
      Program(node) {
        checked = domainFile.test(context.filename) && importsDomain(node);
      },
      ImportDeclaration: check,
      ExportAllDeclaration: check,
      ExportNamedDeclaration: check,
      ImportExpression(node) {
        checkSource(node.source);
      },
      CallExpression(node) {
        if (node.arguments[0] !== undefined && isGlobalIdentifier(node.callee, context, 'require')) {
          checkSource(node.arguments[0]);
        }
      },
    };
  },
);
