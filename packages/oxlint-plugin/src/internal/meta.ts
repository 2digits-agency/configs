import { Rule, type RuleMeta } from 'effect-oxlint';

type MetaOptions = Parameters<typeof Rule.meta>[0] & {
  readonly messages: Record<string, string>;
  /**
   * Upstream reference or documentation for the rule.
   */
  readonly url?: string;
};

/**
 * `Rule.meta` for a recommended rule of this plugin. Rules accept no options unless they pass `schema`.
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
