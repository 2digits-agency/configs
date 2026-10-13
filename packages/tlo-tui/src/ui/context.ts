import { createContext, use } from 'react';

import type { AppAtoms } from './atoms.js';

export const AtomsContext = createContext<AppAtoms | undefined>(undefined);

export function useAtoms(): AppAtoms {
  const atoms = use(AtomsContext);

  if (atoms === undefined) {
    throw new Error('AtomsContext is missing');
  }

  return atoms;
}
