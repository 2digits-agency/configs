import type { Transform } from 'style-dictionary/types';

/**
 * Transforms pixel values to rem for spacing tokens.
 * Assumes 16px base font size.
 */
export const spacingRemTransform: Transform = {
  name: 'figma/spacing-rem',
  type: 'value',
  transitive: true,
  filter(token) {
    // Only transform number tokens in spacing-related paths
    if (token.$type !== 'number') {
      return false;
    }
    const path = token.path.join('.');

    return path.includes('spacing') || path.includes('Gaps padding and margins') || path.includes('Container');
  },
  transform(token) {
    const px = token.$value as number;

    if (px === 0) {
      return '0';
    }
    const rem = px / 16;

    return `${rem}rem`;
  },
};
