import * as Schema from 'effect/Schema';

import { DeclarationFile, TestFilename } from '../schemas/names';

/**
 * Whether a file name is a `.test` or `.spec` file.
 */
export const isTestFilename = Schema.is(TestFilename);

/**
 * Whether a file name is a `.d.ts`, `.d.mts` or `.d.cts` declaration file.
 */
export const isDeclarationFilename = Schema.is(DeclarationFile);
