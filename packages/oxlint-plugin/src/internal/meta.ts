import { Rule, type RuleMeta } from 'effect-oxlint';

type MetaOptions = Parameters<typeof Rule.meta>[0] & {
  readonly messages: Record<string, string>;
  /**
   * Upstream reference or documentation for the rule.
   */
  readonly url?: string;
};

/**
 * Shared metadata defaults: no options and recommended membership. Set `docs.recommended: false` for opt-in rules; the
 * plugin derives both recommended exports from this flag and assigns their severity.
 *
 * @param options Rule metadata.
 */
export function ruleMeta(options: MetaOptions): RuleMeta {
  const { url, docs, ...meta } = options;

  return Rule.meta({
    schema: [],
    ...meta,
    docs: { recommended: true, ...(url === undefined ? {} : { url }), ...docs },
  });
}
