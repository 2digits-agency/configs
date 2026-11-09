import * as Schema from 'effect/Schema';

/**
 * Whether a file name is a `.test` or `.spec` file.
 */
export const isTestFilename = Schema.is(Schema.String.check(Schema.isPattern(/\.(?:test|spec)\.[cm]?[jt]sx?$/u)));
