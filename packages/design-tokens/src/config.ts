import StyleDictionary from 'style-dictionary';

import { cssVariablesFormat, tailwindConfigFormat } from './formats/index.js';
import { figmaReferencesPreprocessor } from './preprocessors/index.js';
import { colorHexTransform, fontWeightTransform, spacingRemTransform } from './transforms/index.js';

export const TRANSFORM_GROUP = 'figma/tailwind';

export const TRANSFORMS = [colorHexTransform.name, spacingRemTransform.name, fontWeightTransform.name] as const;

export interface BuildTokensOptions {
  lightModeTokens: string;
  mobileTokens: string;
  desktopTokens: string;
  outputDir: string;
  breakpoint?: string;
}

export function createStyleDictionary(options: BuildTokensOptions): StyleDictionary {
  const sd = new StyleDictionary({
    source: [options.lightModeTokens, options.mobileTokens],
    preprocessors: [figmaReferencesPreprocessor.name],
    platforms: {
      tailwind: {
        transformGroup: TRANSFORM_GROUP,
        buildPath: options.outputDir.endsWith('/') ? options.outputDir : `${options.outputDir}/`,
        files: [
          {
            destination: 'tailwind.config.ts',
            format: tailwindConfigFormat.name,
          },
          {
            destination: 'tokens.css',
            format: cssVariablesFormat.name,
            options: {
              breakpoint: options.breakpoint ?? '768px',
            },
          },
        ],
      },
    },
  });

  sd.registerPreprocessor(figmaReferencesPreprocessor);

  sd.registerTransform(colorHexTransform);
  sd.registerTransform(spacingRemTransform);
  sd.registerTransform(fontWeightTransform);

  sd.registerTransformGroup({
    name: TRANSFORM_GROUP,
    transforms: [...TRANSFORMS],
  });

  sd.registerFormat(tailwindConfigFormat);
  sd.registerFormat(cssVariablesFormat);

  return sd;
}

export async function buildTokens(options: BuildTokensOptions): Promise<void> {
  const sd = createStyleDictionary(options);

  await sd.buildAllPlatforms();
}
