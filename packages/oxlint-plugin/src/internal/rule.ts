// Runtime bridge adapted from effect-oxlint 0.5.0 (MIT); see NOTICE.
import { Rule, RuleContext, Visitor, type CreateRule } from 'effect-oxlint';
import * as Context from 'effect/Context';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

/**
 * Define a rule with effect-oxlint's contracts, but reuse the service context across node visits. Empty handlers need
 * no fiber; other effects still run synchronously with per-file Ref state and RuleContext.
 *
 * @param config Rule metadata, options decoder and create generator.
 */
export function defineRule<TOptions = undefined>(config: Rule.RuleConfig<TOptions>): CreateRule {
  return {
    meta: Rule.define(config).meta,
    create(context) {
      const service = RuleContext.of({
        // Keep the upstream lazy report boundary without adding tracing to every diagnostic.
        // @effect-diagnostics-next-line effectFnOpportunity:off
        report: (diagnostic) => Effect.sync(() => context.report(diagnostic)),
        id: context.id,
        filename: context.filename,
        cwd: context.cwd,
        options: context.options,
        sourceCode: context.sourceCode,
        languageOptions: context.languageOptions,
        settings: context.settings,
      });
      const run = Effect.runSyncWith(Context.make(RuleContext, service));
      const options =
        config.options === undefined
          ? // Without a decoder the default option type is undefined, as in Rule.define.
            Effect.succeed(undefined as TOptions)
          : Schema.decodeEffect(config.options)(context.options[0]).pipe(
              Effect.mapError((error) => Rule.RuleOptionsError.make({ rule: config.name, issue: error.message })),
              Effect.orDie,
            );
      const visitor = run(Effect.flatMap(options, (decoded) => Effect.gen(config.create.bind(config, decoded))));

      // Oxlint dispatches each key only to its corresponding node type, as in Rule.define.
      return Visitor.toOxlintVisitor(visitor as Visitor.EffectVisitor, (effect) => {
        if (effect !== Effect.void) {
          run(effect);
        }
      });
    },
  };
}
