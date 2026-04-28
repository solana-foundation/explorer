import type { SearchOptions } from './types';

export type FilterId = 'all' | 'feature-gates' | 'other' | 'programs' | 'tokens';

export type FilterTab = {
    groups: SearchGroup[] | null;
    id: FilterId;
    label: string;
};

export enum SearchGroup {
    Accounts = 'Accounts',
    Blocks = 'Blocks',
    DomainOwners = 'Domain Owners',
    Epochs = 'Epochs',
    FeatureGates = 'Feature Gates',
    NameServiceAccounts = 'Name Service Accounts',
    ProgramLoaders = 'Program Loaders',
    Programs = 'Programs',
    Sysvars = 'Sysvars',
    Tokens = 'Tokens',
    Transactions = 'Transactions',
}

export const FILTER_TABS: FilterTab[] = [
    { groups: null, id: 'all', label: 'All' },
    { groups: [SearchGroup.Tokens], id: 'tokens', label: 'Tokens' },
    { groups: [SearchGroup.Programs, SearchGroup.ProgramLoaders], id: 'programs', label: 'Programs' },
    { groups: [SearchGroup.FeatureGates], id: 'feature-gates', label: 'Feature Gates' },
    {
        groups: [
            SearchGroup.Accounts,
            SearchGroup.Blocks,
            SearchGroup.DomainOwners,
            SearchGroup.Epochs,
            SearchGroup.NameServiceAccounts,
            SearchGroup.Sysvars,
            SearchGroup.Transactions,
        ],
        id: 'other',
        label: 'Other',
    },
];

export type ComputedFilterArgs = {
    activeFilter: FilterId;
    counts: Record<FilterId, number>;
    filteredResults: SearchOptions[];
    visibleTabs: FilterTab[];
};

export function computeFilterArgs(results: SearchOptions[], activeFilter: FilterId = 'all'): ComputedFilterArgs {
    let total = 0;
    const byGroup = new Map<SearchGroup, number>();
    for (const g of results) {
        byGroup.set(g.label as SearchGroup, g.options.length);
        total += g.options.length;
    }

    const counts = Object.fromEntries(
        FILTER_TABS.map(tab => [
            tab.id,
            tab.groups === null ? total : tab.groups.reduce((sum, label) => sum + (byGroup.get(label) ?? 0), 0),
        ]),
    ) as Record<FilterId, number>;

    const visibleTabs = FILTER_TABS.filter(t => t.id === 'all' || counts[t.id] > 0);

    const activeGroups = FILTER_TABS.find(t => t.id === activeFilter)?.groups;
    const filtered = activeGroups ? results.filter(g => activeGroups.includes(g.label as SearchGroup)) : results;

    if (activeFilter !== 'all') {
        return { activeFilter, counts, filteredResults: filtered, visibleTabs };
    }

    const reordered = [...filtered];

    // Tokens first
    const tokensIdx = reordered.findIndex(g => g.label === SearchGroup.Tokens);
    if (tokensIdx > 0) reordered.unshift(reordered.splice(tokensIdx, 1)[0]);

    // Feature Gates last
    const fgIndex = reordered.findIndex(g => g.label === SearchGroup.FeatureGates);
    if (fgIndex !== -1 && fgIndex < reordered.length - 1) reordered.push(reordered.splice(fgIndex, 1)[0]);

    return { activeFilter, counts, filteredResults: reordered, visibleTabs };
}
