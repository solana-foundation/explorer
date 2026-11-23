import { Cluster } from '@utils/cluster';

import type { SearchContext } from '../../lib/types';

export function createSearchContext(overrides?: Partial<SearchContext>): SearchContext {
    return { cluster: Cluster.Mainnet, currentEpoch: undefined, ...overrides };
}
