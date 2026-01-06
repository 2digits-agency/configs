import { ifCurly } from './if-curly';
import { preferInlineArrayCallbacks } from './prefer-inline-array-callbacks';
import { preferInlineHandlers } from './prefer-inline-handlers';
import { typeParamNames } from './type-param-names';

export const rules = {
  'if-curly': ifCurly,
  'prefer-inline-array-callbacks': preferInlineArrayCallbacks,
  'prefer-inline-handlers': preferInlineHandlers,
  'type-param-names': typeParamNames,
};
