// Mirrors the Triton `getTransactionsForAddress` `filters` object one-to-one, so the
// UI/URL layer and the RPC payload share the same shape and field names. The UI only
// surfaces range bounds (gte/lte); the RPC also accepts gt/lt/eq which we don't use yet.
export type RangeFilter = { gte?: number; lte?: number };
export type HistoryFilters = {
    slot?: RangeFilter; // filters.slot
    blockTime?: RangeFilter; // filters.blockTime (unix seconds)
    status?: 'succeeded' | 'failed'; // filters.status (omit for "any")
};

// `HistoryFilters` already mirrors the RPC `filters` shape, so this just drops empty
// entries. Returns undefined when no filter is active so the key is omitted entirely.
export function buildRpcFilters(filters: HistoryFilters): Record<string, unknown> | undefined {
    const out: Record<string, unknown> = {};
    const slot = pruneRange(filters.slot);
    if (slot) out.slot = slot;
    const blockTime = pruneRange(filters.blockTime);
    if (blockTime) out.blockTime = blockTime;
    if (filters.status) out.status = filters.status;
    return Object.keys(out).length > 0 ? out : undefined;
}

// Whether any filter would reach the RPC. Callers use this to decide whether
// `getSignaturesForAddress`, which honours no filters, can stand in for a query.
export function hasActiveFilters(filters: HistoryFilters): boolean {
    return buildRpcFilters(filters) !== undefined;
}

// Prunes undefined leaves so the RPC never receives an empty range like `{ slot: {} }`.
function pruneRange(range: RangeFilter | undefined): RangeFilter | undefined {
    if (!range) return undefined;
    const out: RangeFilter = {};
    if (range.gte !== undefined) out.gte = range.gte;
    if (range.lte !== undefined) out.lte = range.lte;
    return Object.keys(out).length > 0 ? out : undefined;
}
