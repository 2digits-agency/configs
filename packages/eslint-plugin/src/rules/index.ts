import { ifCurly } from './if-curly';
import { preferInlineHandlers } from './prefer-inline-handlers';
import { typeParamNames } from './type-param-names';

export const rules = {
  'if-curly': ifCurly,
  'prefer-inline-handlers': preferInlineHandlers,
  'type-param-names': typeParamNames,
};
