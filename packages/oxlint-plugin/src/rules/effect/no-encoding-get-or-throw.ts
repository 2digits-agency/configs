import { Diagnostic, Rule, RuleContext, Visitor, type ESTree } from 'effect-oxlint';
import * as Arr from 'effect/Array';
import * as Effect from 'effect/Effect';
import * as Opt from 'effect/Option';
import type * as Result from 'effect/Result';

import { argumentAt, staticPropertyName, unwrapExpression } from '../../internal/ast';
import { importBindings, type ImportBindings } from '../../internal/imports';
import { ruleMeta } from '../../internal/meta';

const encodingModules = ['Base64', 'Base64Url', 'Hex'] as const;

const decoders = ['decode', 'decodeString'] as const;

const getOrThrowMethods = ['getOrThrow', 'getOrThrowWith'] as const satisfies ReadonlyArray<keyof typeof Result>;

/**
 * The `Module.decoder` name of a `Base64`, `Base64Url` or `Hex` decode call from `effect/encoding`.
 *
 * @param node Expression.
 * @param imports Import bindings of the file.
 */
function encodingDecoder(node: ESTree.Node, imports: ImportBindings): Opt.Option<string> {
  const target = node.type === 'ChainExpression' ? node.expression : unwrapExpression(node as ESTree.Expression);

  if (target.type !== 'CallExpression') {
    return Opt.none();
  }

  return imports.path(target.callee).pipe(
    Opt.filter(
      (path) => path.length === 2 && Arr.contains(encodingModules, path[0]) && Arr.contains(decoders, path[1]),
    ),
    Opt.map(Arr.join('.')),
  );
}

/**
 * `Result.getOrThrow`, `Result.getOrThrowWith` or `Result.getOrThrowWith(onFailure)` as a pipeline step.
 *
 * @param node Pipeline step.
 * @param imports Import bindings of the file.
 */
function getOrThrowStep(node: ESTree.Node, imports: ImportBindings): Opt.Option<string> {
  const step = node.type === 'CallExpression' ? node.callee : node;

  return Opt.filter(imports.member(step, 'Result'), (member) => Arr.contains(getOrThrowMethods, member));
}

/**
 * The decoder and `getOrThrow` method of `Result.getOrThrow(Base64.decode(x))`, `Base64.decode(x).pipe(
 * Result.getOrThrow)` or `pipe(Base64.decode(x), Result.getOrThrow)`.
 *
 * @param node Call.
 * @param imports Import bindings of the file.
 */
function thrownDecode(
  node: ESTree.CallExpression,
  imports: ImportBindings,
): Opt.Option<{ readonly decoder: string; readonly method: string }> {
  const direct = Opt.filter(imports.member(node.callee, 'Result'), (member) => Arr.contains(getOrThrowMethods, member));

  if (Opt.isSome(direct)) {
    return argumentAt(node, 0).pipe(
      Opt.flatMap((argument) => encodingDecoder(argument, imports)),
      Opt.map((decoder) => ({
        decoder,
        method: direct.value,
      })),
    );
  }

  const piped =
    node.callee.type === 'MemberExpression' && Opt.contains(staticPropertyName(node.callee), 'pipe')
      ? Opt.some({ source: node.callee.object, steps: node.arguments })
      : imports.isApi(node.callee, 'Function', 'pipe') ||
          (node.callee.type === 'Identifier' && node.callee.name === 'pipe')
        ? Opt.map(Arr.head(node.arguments), (source) => ({ source, steps: Arr.drop(node.arguments, 1) }))
        : Opt.none();

  // Only `Result.map` may run before `getOrThrow`; other steps can recover the EncodingError first.
  return Opt.flatMap(piped, ({ source, steps }) =>
    Opt.zipWith(
      encodingDecoder(source, imports),
      Opt.flatMap(
        Arr.findFirst(
          steps,
          (step) =>
            step.type !== 'CallExpression' ||
            !imports.isApi(step.callee, 'Result', 'map' satisfies keyof typeof Result),
        ),
        (step) => getOrThrowStep(step, imports),
      ),
      (decoder, method) => ({ decoder, method }),
    ),
  );
}

export const noEncodingGetOrThrow = Rule.define({
  name: 'no-encoding-get-or-throw',
  meta: ruleMeta({
    type: 'problem',
    description: 'Disallow throwing away the typed EncodingError of Effect Base64, Base64Url, and Hex decoders.',
    messages: {
      getOrThrow:
        'Result.{{method}} turns the EncodingError of {{decoder}} into an untyped exception. Keep it typed with yield* Effect.fromResult(…), or handle it with Result.match or Result.getOrElse.',
    },
    url: 'https://effect.website/docs/v4/api/effect/encoding/EncodingError',
  }),
  *create() {
    const ctx = yield* RuleContext;

    const imports = yield* importBindings;

    return Visitor.on('CallExpression', (node) =>
      Opt.match(thrownDecode(node, imports), {
        onNone: () => Effect.void,
        onSome: (data) => ctx.report(Diagnostic.fromId({ node, messageId: 'getOrThrow', data })),
      }),
    );
  },
});
