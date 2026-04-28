import { fetchTokenResults } from '../api/fetch-token-results';
import type { SearchProvider } from '../lib/types';

export const tokenSearchProvider: SearchProvider = {
    kind: 'remote',
    name: 'token-search',
    priority: 100,
    search: fetchTokenResults,
};
