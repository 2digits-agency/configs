import { Diagnostic, RuleContext, Visitor, type CreateRule, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import type * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import * as Schema from 'effect/Schema';

import { argumentAt, isStringLiteral, staticPath, staticPropertyName } from '../../internal/ast';
import { importBindings, moduleImportMember } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';
import { defineRule } from '../../internal/rule';
import { isGlobalIdentifier, isImportedApiIn } from '../../internal/scope';

const DirectoryLibrary = Schema.Literals([
  'appdirsjs',
  'application-config-path',
  'env-paths',
  'os-homedir',
  'platform-folders',
  'user-home',
  'xdg-app-paths',
  'xdg-basedir',
]);

const isDirectoryLibrary = Schema.is(DirectoryLibrary);

/**
 * Environment variables that `UserDirectories` reads through the `ConfigProvider`.
 */
const DirectoryVariable = Schema.Literals([
  'APPDATA',
  'HOME',
  'LOCALAPPDATA',
  'USERPROFILE',
  'XDG_CACHE_HOME',
  'XDG_CONFIG_HOME',
  'XDG_DATA_HOME',
  'XDG_STATE_HOME',
]);

const isDirectoryVariable = Schema.is(DirectoryVariable);

const osSources: ReadonlyArray<string> = ['node:os', 'os'];

/**
 * The directory variable a `process.env.NAME` or `process.env['NAME']` read names, unless it is assigned to.
 *
 * @param node Member expression.
 */
function processEnvVariable(node: ESTree.MemberExpression): Opt.Option<string> {
  const isAssigned = node.parent.type === 'AssignmentExpression' && node.parent.left === node;

  return isAssigned || !Opt.exists(staticPath(node.object), (path) => Arr.join(path, '.') === 'process.env')
    ? Opt.none()
    : Opt.filter(staticPropertyName(node), isDirectoryVariable);
}

export const preferEffectUserDirectories: CreateRule = defineRule({
  name: 'prefer-effect-user-directories',
  meta: ruleMeta({
    type: 'suggestion',
    description:
      'Prefer the Effect UserDirectories service over home directories and XDG paths resolved by hand in Effect projects.',
    messages: {
      homedir:
        'Use the UserDirectories service from effect/persistence instead of os.homedir(): dirs.config, dirs.data, dirs.cache and dirs.state resolve the platform directory, and dirs.home the home directory.',
      variable:
        'Use the UserDirectories service from effect/persistence instead of reading {{name}}: it applies the XDG, macOS and Windows conventions and reads the environment through the ConfigProvider.',
      library: 'Use the UserDirectories service from effect/persistence instead of {{source}}.',
    },
    url: 'https://effect.website/docs/v4/api/effect/persistence/UserDirectories',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    if (!imports.hasEffectImport) {
      return {};
    }

    function reportVariable(node: ESTree.Node, name: string) {
      return ctx.report(Diagnostic.fromId({ node, messageId: 'variable', data: { name } }));
    }

    return Visitor.merge(
      Visitor.on('ImportDeclaration', ({ source }) =>
        isDirectoryLibrary(source.value)
          ? ctx.report(Diagnostic.fromId({ node: source, messageId: 'library', data: { source: source.value } }))
          : Effect.void,
      ),
      Visitor.on('CallExpression', (node) => {
        if (Opt.contains(moduleImportMember(ctx.sourceCode, node.callee, osSources), 'homedir')) {
          return ctx.report(Diagnostic.fromId({ node, messageId: 'homedir' }));
        }

        const isConfigRead =
          imports.isApi(node.callee, 'Config', ['String', 'NonEmptyString', 'Redacted'] satisfies ReadonlyArray<
            keyof typeof Config
          >) && isImportedApiIn(ctx.sourceCode, node.callee);

        const configVariable = isConfigRead
          ? Opt.filter(
              Opt.map(Opt.filter(argumentAt(node, 0), isStringLiteral), ({ value }) => value),
              isDirectoryVariable,
            )
          : Opt.none();

        return Opt.match(configVariable, { onNone: () => Effect.void, onSome: (name) => reportVariable(node, name) });
      }),
      Visitor.on('MemberExpression', (node) =>
        Opt.match(processEnvVariable(node), {
          onNone: () => Effect.void,
          onSome: (name) =>
            node.object.type === 'MemberExpression'
              ? Effect.when(reportVariable(node, name), isGlobalIdentifier(node.object.object, 'process'))
              : Effect.void,
        }),
      ),
    );
  },
});
