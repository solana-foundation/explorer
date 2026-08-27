import { FEATURE_GATES } from '@entities/feature-gate';

import { SearchGroup } from '../lib/filter-tabs';
import { parseSimdNumber, parseSimdQuery } from '../lib/parse-simd-number';
import type { SearchOptions, SearchProvider } from '../lib/types';

/**
 * Local search provider that matches Solana feature gates by title or by SIMD
 * number.
 *
 * Feature gates control the activation of runtime features across the
 * cluster. This provider searches the static `feature-gates.json` registry
 * and links to each gate's account page.
 *
 * Older gates carry no SIMD in their title, so the number is the only route to
 * them.
 *
 * @example
 * // Type a feature gate name into the search bar:
 * // MoveStake
 */
export const featureGateSearchProvider: SearchProvider = {
    kind: 'local',
    name: 'feature-gate',
    // A SIMD number is often an epoch number too, and the epoch is the likelier intent.
    priority: 5,
    search(query: string): SearchOptions[] {
        if (query.length < 2) return [];

        const queriedSimd = parseSimdQuery(query);
        const upperQuery = query.toUpperCase();

        const features = FEATURE_GATES.filter(feature => {
            if (feature.title.toUpperCase().includes(upperQuery)) return true;
            return queriedSimd !== undefined && feature.simds.some(entry => parseSimdNumber(entry) === queriedSimd);
        });

        if (features.length === 0) return [];

        return [
            {
                label: SearchGroup.FeatureGates,
                options: features.map(feature => ({
                    label: feature.title,
                    pathname: `/address/${feature.key}`,
                    sublabel: feature.key,
                    type: 'address',
                    value: [feature.key],
                })),
            },
        ];
    },
};
