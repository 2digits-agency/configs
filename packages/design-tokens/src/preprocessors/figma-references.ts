import type { PreprocessedTokens, Preprocessor } from 'style-dictionary/types';

/**
 * Fixes Figma's comma-decimal reference syntax.
 * Figma exports references like `{Spacing Primitives.0,5}` which should be `{Spacing Primitives.0.5}`
 */
export const figmaReferencesPreprocessor: Preprocessor = {
  name: 'figma/fix-references',
  preprocessor(dictionary) {
    return fixReferencesRecursive(dictionary) as PreprocessedTokens;
  },
};

function fixReferencesRecursive(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Fix comma-decimal in key names (e.g., "0,5" -> "0.5")
    const fixedKey = key.replaceAll(/,(\d)/g, '.$1');

    if (typeof value === 'string') {
      // Fix comma-decimal in reference values
      result[fixedKey] = value.replaceAll(/\{([^}]+)\}/g, (_match, ref: string) => {
        const fixedRef = ref.replaceAll(/,(\d)/g, '.$1');

        return `{${fixedRef}}`;
      });
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[fixedKey] = fixReferencesRecursive(value as Record<string, unknown>);
    } else {
      result[fixedKey] = value;
    }
  }

  return result;
}
