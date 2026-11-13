import type { ActivatedFeature } from './partition-features';

export type SortDirection = 'asc' | 'desc';

/** Newest activation first, the order the Activated section opens in. */
export const DEFAULT_SORT_DIRECTION: SortDirection = 'desc';

export const isSortDirection = (value: string | null | undefined): value is SortDirection =>
    value === 'asc' || value === 'desc';

/** Returns a new array ordered by the activation epoch on the current cluster. */
export function sortActivatedFeatures(features: readonly ActivatedFeature[], direction: SortDirection) {
    const dir = direction === 'asc' ? 1 : -1;
    return [...features].sort((a, b) => dir * (a.clusterActivationEpoch - b.clusterActivationEpoch));
}
