import { cn } from '@shared/utils';

import type { FilterId, FilterTab } from '../lib/filter-tabs';

type SearchFilterProps = {
    tabs: FilterTab[];
    activeFilter: FilterId;
    counts: Record<FilterId, number>;
    onFilterChange: (id: FilterId) => void;
};

export function SearchFilters({ tabs, activeFilter, counts, onFilterChange }: SearchFilterProps) {
    return (
        <div
            className={cn(
                'flex gap-1.5 overflow-x-auto px-3 pb-2 pt-2.5',
                '[&::-webkit-scrollbar]:hidden',
            )}
        >
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={cn(
                        'flex shrink-0 cursor-pointer items-center gap-1 px-2.5 py-0.5',
                        'rounded-md border border-solid text-xs font-medium transition-colors',
                        activeFilter === tab.id
                            ? 'border-accent-600 bg-accent-600 text-heavy-metal-950'
                            : 'border-heavy-metal-600 bg-transparent text-heavy-metal-200 hover:border-heavy-metal-400 hover:text-white',
                    )}
                    type="button"
                    onClick={() => onFilterChange(tab.id)}
                    onMouseDown={e => e.preventDefault()}
                >
                    {tab.label}
                    <span className={activeFilter === tab.id ? 'text-heavy-metal-900' : 'text-heavy-metal-400'}>
                        ({counts[tab.id]})
                    </span>
                </button>
            ))}
        </div>
    );
}
