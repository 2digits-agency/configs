import * as Schema from 'effect/Schema';

import { TestFilename } from '../schemas/names';

/**
 * Whether a file name is a `.test` or `.spec` file.
 */
export const isTestFilename = Schema.is(TestFilename);
