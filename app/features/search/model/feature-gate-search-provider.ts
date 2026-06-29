import { FEATURE_GATES } from '@entities/feature-gate';

import { SearchGroup } from '../lib/filter-tabs';
import type { SearchOptions, SearchProvider } from '../lib/types';

/**
 * Local search provider that matches Solana feature gates by title.
 *
 * Feature gates control the activation of runtime features across the
 * cluster. This provider searches the static `feature-gates.json` registry
 * and links to each gate's account page.
 *
 * @example
 * // Type a feature gate name into the search bar:
 * // MoveStake
 */
export const featureGateSearchProvider: SearchProvider = {
    kind: 'local',
    name: 'feature-gate',
    priority: 30,
    search(query: string): SearchOptions[] {
        if (query.length < 2) return [];

        const features = FEATURE_GATES.filter(
            feature => feature.key && feature.title.toUpperCase().includes(query.toUpperCase()),
        );

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
