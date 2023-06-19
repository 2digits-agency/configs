import type { Extends } from 'eslint-define-config';
import { getPackageInfoSync } from 'local-pkg';

const nextVersion = getPackageInfoSync('next')?.version;

export const next = (nextVersion ? ['next'] : []) satisfies Extends;
