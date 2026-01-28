import type { Transform } from 'style-dictionary/types';

interface FigmaColorValue {
  colorSpace: string;
  components: Array<number>;
  alpha: number;
  hex: string;
}

function isFigmaColor(value: unknown): value is FigmaColorValue {
  if (value === null || typeof value !== 'object') {
    return false;
  }
  const obj = value as Record<string, unknown>;

  return typeof obj.hex === 'string' && Array.isArray(obj.components) && typeof obj.colorSpace === 'string';
}

/**
 * Transforms Figma color objects to hex values.
 * Figma exports colors as `{colorSpace, components, alpha, hex}`
 */
export const colorHexTransform: Transform = {
  name: 'figma/color-hex',
  type: 'value',
  transitive: true,
  filter(token) {
    return token.$type === 'color' && isFigmaColor(token.$value);
  },
  transform(token) {
    const value = token.$value as FigmaColorValue;

    return value.hex;
  },
};
