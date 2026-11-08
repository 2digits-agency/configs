import { ifCurly } from './if-curly';
import { noClientValueImportInServer } from './no-client-value-import-in-server';
import { noUtcIsoSlicing } from './no-utc-iso-slicing';
import { preferInlineArrayCallbacks } from './prefer-inline-array-callbacks';
import { preferInlineHandlers } from './prefer-inline-handlers';
import { typeParamNames } from './type-param-names';
import { validDirective } from './valid-directive';

export const rules = {
  'if-curly': ifCurly,
  'no-utc-iso-slicing': noUtcIsoSlicing,
  'no-client-value-import-in-server': noClientValueImportInServer,
  'prefer-inline-array-callbacks': preferInlineArrayCallbacks,
  'prefer-inline-handlers': preferInlineHandlers,
  'type-param-names': typeParamNames,
  'valid-directive': validDirective,
};
