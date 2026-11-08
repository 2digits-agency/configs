import { ifCurly } from './if-curly';
import { noUtcIsoSlicing } from './no-utc-iso-slicing';
import { preferInlineArrayCallbacks } from './prefer-inline-array-callbacks';
import { preferInlineHandlers } from './prefer-inline-handlers';
import { typeParamNames } from './type-param-names';

export const rules = {
  'if-curly': ifCurly,
  'no-utc-iso-slicing': noUtcIsoSlicing,
  'prefer-inline-array-callbacks': preferInlineArrayCallbacks,
  'prefer-inline-handlers': preferInlineHandlers,
  'type-param-names': typeParamNames,
};
