import { atom } from 'jotai';

// Pagination state atoms
export const paginationDefaults = {
    limit: 12,
    offset: 0,
    total: null as number | null,
};
export const paginationAtom = atom(paginationDefaults);
