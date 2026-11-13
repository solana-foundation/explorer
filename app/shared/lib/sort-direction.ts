// Shared so a sort direction has one type and one URL guard across the block and feature-gate tables.
// Each feature keeps its own DEFAULT_SORT_DIRECTION.
export type SortDirection = 'asc' | 'desc';

export const isSortDirection = (value: string | null | undefined): value is SortDirection =>
    value === 'asc' || value === 'desc';
