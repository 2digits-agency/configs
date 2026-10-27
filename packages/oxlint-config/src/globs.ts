// Oxlint matches override globs without extglobs, so these spell out the ESLint config's `?([cm])` and `?(x)` patterns.

export const GLOB_TS = '**/*.{ts,cts,mts}';

export const GLOB_TSX = '**/*.tsx';

export const GLOB_TESTS = '**/*.{test,spec}.{ts,tsx}';
