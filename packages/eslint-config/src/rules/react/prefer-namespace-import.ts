import type { RuleFunction, RuleToolkit, RuleListener } from '@eslint-react/kit';
import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint';

export function preferNamespaceImport(): RuleFunction {
  return preferNamespaceImportImpl;
}

function preferNamespaceImportImpl(context: RuleContext, { settings }: RuleToolkit): RuleListener {
  return {
    ImportDeclaration(node) {
      if (node.source.value !== settings.importSource) {
        return;
      }

      const defaultSpecifier = node.specifiers.find(
        (specifier) => specifier.type === AST_NODE_TYPES.ImportDefaultSpecifier,
      );

      if (defaultSpecifier === undefined) {
        return;
      }

      context.report({
        fix(fixer) {
          const importText = context.sourceCode.getText(node);
          const semi = importText.endsWith(';') ? ';' : '';
          const quote = node.source.raw.at(0) ?? "'";
          const importPrefix = `import${node.importKind === 'type' ? ' type' : ''}`;
          const quotedSource = `${quote}${settings.importSource}${quote}`;

          if (node.specifiers.length === 1) {
            return fixer.remove(node);
          }

          const namedSpecifiers = importText.slice(importText.indexOf('{'), importText.indexOf('}') + 1);

          return fixer.replaceText(node, `${importPrefix} ${namedSpecifiers} from ${quotedSource}${semi}`);
        },
        message: `Prefer importing React as 'import * as React from "${settings.importSource}"';`,
        node: node.specifiers.length > 1 ? defaultSpecifier : node,
      });
    },
  };
}
