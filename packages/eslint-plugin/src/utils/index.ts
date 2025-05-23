import type { RuleListener, RuleWithMeta, RuleWithMetaAndName } from '@typescript-eslint/utils/eslint-utils';
import type { RuleContext } from '@typescript-eslint/utils/ts-eslint';
import type { Rule } from 'eslint';

import { repository } from '../../package.json';

const blobUrl = `${repository.url.replaceAll('.git', '')}/tree/main/${repository.directory}/src/rules`;

/** @public */
export interface RuleModule<T extends ReadonlyArray<unknown>> extends Rule.RuleModule {
  defaultOptions: T;
}

/**
 * Creates reusable function to create rules with default options and docs URLs.
 *
 * @param urlCreator Creates a documentation URL for a given rule name.
 * @returns Function to create a rule with the docs URL format.
 */
function RuleCreator(urlCreator: (name: string) => string) {
  // This function will get much easier to call when this is merged https://github.com/Microsoft/TypeScript/pull/26349
  // TODO - when the above PR lands; add type checking for the context.report `data` property
  return function createNamedRule<TOptions extends ReadonlyArray<Record<string, unknown>>, TMessageIds extends string>({
    name,
    meta,
    ...rule
  }: Readonly<RuleWithMetaAndName<TOptions, TMessageIds>>): RuleModule<TOptions> {
    return createRule<TOptions, TMessageIds>({
      meta: {
        ...meta,
        docs: {
          ...meta.docs,
          url: urlCreator(name),
        },
      },
      ...rule,
    });
  };
}

function createRule<TOptions extends ReadonlyArray<Record<string, unknown>>, TMessageIds extends string>({
  create,
  defaultOptions,
  meta,
}: Readonly<RuleWithMeta<TOptions, TMessageIds>>): RuleModule<TOptions> {
  return {
    create: ((context: Readonly<RuleContext<TMessageIds, TOptions>>): RuleListener => {
      const optionsWithDefault = context.options.map((options, index) => {
        return {
          ...defaultOptions[index],
          ...options,
        };
      }) as unknown as TOptions;

      return create(context as never, optionsWithDefault);
    }) as unknown,
    defaultOptions,
    meta,
  } as unknown as RuleModule<TOptions>;
}

export const createEslintRule = RuleCreator((ruleName) => `${blobUrl}${ruleName}.ts`) as unknown as <
  TOptions extends ReadonlyArray<unknown>,
  TMessageIds extends string,
>({
  name,
  meta,
  ...rule
}: Readonly<RuleWithMetaAndName<TOptions, TMessageIds>>) => RuleModule<TOptions>;
