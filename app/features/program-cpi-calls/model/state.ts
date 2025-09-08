import { atom } from 'jotai';

import { ProgramCallData } from './use-program-cpi-calls';

// Store for the actual CPI calls data
export const programCpiCallsAtom = atom<ProgramCallData[]>([]);

// Pagination state atoms
export const paginationDefaults = {
    limit: 50,
    offset: 0,
    total: null as number | null,
};
export const paginationAtom = atom(paginationDefaults);
