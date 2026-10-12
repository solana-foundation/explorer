import { cn } from '@components/shared/utils';

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
                'flex gap-1.5 overflow-x-auto px-3 py-2.5',
                'border-0 border-b border-solid border-outer-space-800',
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
                            ? 'border-accent-600 bg-accent-600 text-outer-space-950'
                            : 'border-outer-space-600 bg-transparent text-outer-space-200 hover:border-outer-space-400 hover:text-white',
                    )}
                    type="button"
                    onClick={() => onFilterChange(tab.id)}
                    onMouseDown={e => e.preventDefault()}
                >
                    {tab.label}
                    <span className={activeFilter === tab.id ? 'text-outer-space-900' : 'text-outer-space-400'}>
                        ({counts[tab.id]})
                    </span>
                </button>
            ))}
        </div>
    );
}
