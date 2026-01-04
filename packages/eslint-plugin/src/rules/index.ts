import { ifCurly } from './if-curly';
import { noNull } from './no-null';
import { preferInlineArrayCallbacks } from './prefer-inline-array-callbacks';
import { preferInlineHandlers } from './prefer-inline-handlers';
import { typeParamNames } from './type-param-names';

export const rules = {
  'if-curly': ifCurly,
  'no-null': noNull,
  'prefer-inline-array-callbacks': preferInlineArrayCallbacks,
  'prefer-inline-handlers': preferInlineHandlers,
  'type-param-names': typeParamNames,
};
