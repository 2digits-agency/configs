import type { Transform } from 'style-dictionary/types';

const fontWeightMap: Record<string, number> = {
  thin: 100,
  hairline: 100,
  extralight: 200,
  'extra light': 200,
  ultralight: 200,
  'ultra light': 200,
  light: 300,
  regular: 400,
  normal: 400,
  medium: 500,
  semibold: 600,
  'semi bold': 600,
  demibold: 600,
  'demi bold': 600,
  bold: 700,
  extrabold: 800,
  'extra bold': 800,
  ultrabold: 800,
  'ultra bold': 800,
  black: 900,
  heavy: 900,
};

/**
 * Transforms font weight strings to numeric values.
 * Maps "Bold", "Semi bold", "Medium", etc. to 700, 600, 500, etc.
 */
export const fontWeightTransform: Transform = {
  name: 'figma/font-weight',
  type: 'value',
  transitive: true,
  filter(token) {
    if (token.$type !== 'string') {
      return false;
    }
    const path = token.path.join('.');

    return path.includes('Font Weight');
  },
  transform(token) {
    const value = (token.$value as string).toLowerCase();

    return fontWeightMap[value] ?? 400;
  },
};
