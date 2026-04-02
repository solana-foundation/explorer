import { cn } from '@shared/utils';

import type { FILTER_TABS, FilterId } from './BaseSearch';

type SearchFilterProps = {
    tabs: (typeof FILTER_TABS)[number][];
    activeFilter: FilterId;
    counts: Record<FilterId, number>;
    onFilterChange: (id: FilterId) => void;
};

export function SearchFilters({ tabs, activeFilter, counts, onFilterChange }: SearchFilterProps) {
    return (
        <div
            className={cn(
                'e-flex e-gap-1.5 e-overflow-x-auto e-px-3 e-pb-2 e-pt-2.5',
                '[&::-webkit-scrollbar]:e-hidden',
            )}
        >
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={cn(
                        'e-flex e-shrink-0 e-cursor-pointer e-items-center e-gap-1 e-rounded-full e-px-2.5 e-py-0.5',
                        'e-rounded-md e-border e-border-solid e-text-xs e-font-medium e-transition-colors',
                        activeFilter === tab.id
                            ? 'e-border-accent-600 e-bg-accent-600 e-text-heavy-metal-950'
                            : 'e-border-heavy-metal-600 e-bg-transparent e-text-heavy-metal-200 hover:e-border-heavy-metal-400 hover:e-text-white',
                    )}
                    type="button"
                    onClick={() => onFilterChange(tab.id)}
                    onMouseDown={e => e.preventDefault()}
                >
                    {tab.label}
                    <span className={activeFilter === tab.id ? 'e-text-heavy-metal-900' : 'e-text-heavy-metal-400'}>
                        ({counts[tab.id]})
                    </span>
                </button>
            ))}
        </div>
    );
}
