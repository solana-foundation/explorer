'use client';

import { useHotkeys } from '@mantine/hooks';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@shared/utils';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from 'cmdk';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Search, X } from 'react-feather';

import type { SearchItem, SearchOptions } from '../lib/types';
import { SearchResultItem } from './SearchEntity';
import { SearchFilters } from './SearchFilters';
import { SearchGroupHeading } from './SearchGroupHeading';

export const FILTER_TABS = [
    { groups: null, id: 'all', label: 'All' },
    { groups: ['Tokens'], id: 'tokens', label: 'Tokens' },
    { groups: ['Validators'], id: 'validators', label: 'Validators' },
    { groups: ['Programs', 'Program Loaders'], id: 'programs', label: 'Programs' },
    { groups: ['Feature Gates'], id: 'feature-gates', label: 'Feature Gates' },
    {
        groups: [
            'Accounts',
            'Sysvars',
            'Transactions',
            'Blocks',
            'Epochs',
            'Domains',
            'Domain Owners',
            'Name Service Accounts',
        ],
        id: 'other',
        label: 'Other',
    },
] as const;

export type FilterId = (typeof FILTER_TABS)[number]['id'];

export type BaseSearchProps = {
    value: string;
    open: boolean;
    results: SearchOptions[];
    isLoading: boolean;
    onValueChange: (value: string) => void;
    onOpenChange: (open: boolean) => void;
    onSelect: (option: SearchItem) => void;
};

export function BaseSearch({
    value,
    open,
    results,
    isLoading,
    onValueChange,
    onOpenChange,
    onSelect,
}: BaseSearchProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [activeFilter, setActiveFilter] = useState<FilterId>('all');
    const hasValue = value.length > 0;
    const hasResults = results.some(g => g.options.length > 0);

    // Count results per tab
    const counts = useMemo<Record<FilterId, number>>(() => {
        const byGroup = new Map(results.map(g => [g.label, g.options.length]));
        const total = results.reduce((sum, g) => sum + g.options.length, 0);
        return Object.fromEntries(
            FILTER_TABS.map(tab => [
                tab.id,
                tab.groups === null
                    ? total
                    : (tab.groups as readonly string[]).reduce((sum, label) => sum + (byGroup.get(label) ?? 0), 0),
            ]),
        ) as Record<FilterId, number>;
    }, [results]);

    const visibleTabs = useMemo(
        () => FILTER_TABS.filter(t => t.id === 'all' || counts[t.id] > 0),
        [counts],
    );

    // Filter results for active tab, always showing Feature Gates last
    const filteredResults = useMemo(() => {
        const tab = FILTER_TABS.find(t => t.id === activeFilter);
        const filtered = tab?.groups
            ? results.filter(g => (tab.groups as readonly string[]).includes(g.label))
            : results;

        const fgIndex = filtered.findIndex(g => g.label === 'Feature Gates');
        if (fgIndex === -1 || fgIndex === filtered.length - 1) return filtered;
        const reordered = [...filtered];
        reordered.push(reordered.splice(fgIndex, 1)[0]);
        return reordered;
    }, [results, activeFilter]);

    const handleInputChange = useCallback(
        (next: string) => {
            onValueChange(next);
            onOpenChange(next.trim().length > 0);
            setActiveFilter('all');
        },
        [onValueChange, onOpenChange],
    );

    const handleClear = useCallback(() => {
        onValueChange('');
        onOpenChange(false);
        setActiveFilter('all');
        inputRef.current?.blur();
    }, [onValueChange, onOpenChange]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape') {
                inputRef.current?.blur();
                onOpenChange(false);
                return;
            }
            if (open) return;
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') onOpenChange(true);
        },
        [open, onOpenChange],
    );

    useHotkeys(
        [
            ['/', () => inputRef.current?.focus()],
            ['mod+k', () => inputRef.current?.focus()],
        ],
        ['INPUT', 'TEXTAREA'],
    );

    return (
        <div className="e-w-full">
            <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
                <Command shouldFilter={false} label="Search">
                    <PopoverPrimitive.Anchor asChild>
                        <div
                            className={cn(
                                'e-flex e-items-center e-gap-3',
                                'e-rounded-md e-border e-border-heavy-metal-950 e-bg-heavy-metal-800 [border-style:solid]',
                                'e-h-[38px] e-px-4 e-shadow-md',
                                'e-transition-shadow focus-within:e-shadow-[0_0_0.4rem_#00d18c]',
                            )}
                        >
                            <Search className="e-shrink-0 e-text-heavy-metal-100" size={15} />
                            <Command.Input
                                ref={inputRef}
                                autoFocus
                                className={cn(
                                    'e-w-full e-min-w-0 e-flex-1',
                                    'e-border-none e-bg-transparent e-outline-none',
                                    'e-text-sm e-text-white placeholder:e-text-heavy-metal-100',
                                    'e-overflow-hidden e-text-ellipsis',
                                )}
                                placeholder="Search for tokens, validators, programs, and accounts"
                                value={value}
                                onBlur={() => onOpenChange(false)}
                                onFocus={() => {
                                    if (value.trim().length > 0) onOpenChange(true);
                                }}
                                onKeyDown={handleKeyDown}
                                onValueChange={handleInputChange}
                            />
                            {hasValue ? (
                                <button
                                    aria-label="Clear search"
                                    className={cn(
                                        'e-flex e-h-6 e-w-6 e-shrink-0 e-cursor-pointer e-items-center e-justify-center',
                                        'e-appearance-none e-rounded e-border e-border-solid e-border-heavy-metal-950 e-bg-heavy-metal-700 e-p-0',
                                        'e-text-heavy-metal-100 e-transition-colors hover:e-text-heavy-metal-400',
                                    )}
                                    type="button"
                                    onMouseDown={e => {
                                        e.preventDefault();
                                        handleClear();
                                    }}
                                >
                                    <X size={16} />
                                </button>
                            ) : (
                                <kbd
                                    className={cn(
                                        'e-flex e-h-6 e-w-6 e-shrink-0 e-items-center e-justify-center',
                                        'e-rounded e-border e-border-solid e-border-heavy-metal-950 e-bg-heavy-metal-700',
                                        'e-text-sm e-text-heavy-metal-100',
                                    )}
                                >
                                    /
                                </kbd>
                            )}
                        </div>
                    </PopoverPrimitive.Anchor>

                    {!open && <CommandList aria-hidden="true" className="e-hidden" />}

                    <PopoverPrimitive.Content
                        asChild
                        align="start"
                        sideOffset={4}
                        className={cn(
                            'e-z-10 e-rounded-md e-shadow-2xl [border-style:solid]',
                            'e-w-[var(--radix-popover-trigger-width)]',
                            'e-border e-border-heavy-metal-950 e-bg-heavy-metal-800',
                        )}
                        onInteractOutside={e => {
                            if (e.target instanceof Element && e.target === inputRef.current) e.preventDefault();
                        }}
                        onOpenAutoFocus={e => e.preventDefault()}
                    >
                        <div>
                            {hasResults && visibleTabs.length > 1 && (
                                <SearchFilters
                                    activeFilter={activeFilter}
                                    counts={counts}
                                    tabs={visibleTabs}
                                    onFilterChange={setActiveFilter}
                                />
                            )}

                            <CommandList
                                className={cn(
                                    'e-max-h-[420px] e-overflow-y-auto e-overflow-x-hidden e-pb-2',
                                    '[&::-webkit-scrollbar]:e-w-2',
                                    '[&::-webkit-scrollbar-thumb]:e-rounded-full [&::-webkit-scrollbar-thumb]:e-bg-heavy-metal-600 [&::-webkit-scrollbar-thumb]:hover:e-bg-heavy-metal-500',
                                    '[&::-webkit-scrollbar-track]:e-rounded-md [&::-webkit-scrollbar-track]:e-bg-heavy-metal-800',
                                )}
                                onMouseDown={e => {
                                    if (e.target === e.currentTarget) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }
                                }}
                            >
                                {isLoading && (
                                    <Command.Loading className="e-px-4 e-py-3 e-pb-1 e-text-sm e-text-heavy-metal-400">
                                        Searching...
                                    </Command.Loading>
                                )}

                                {!isLoading && hasResults
                                    ? filteredResults.map(group =>
                                          group.options.length > 0 ? (
                                              <CommandGroup key={group.label}>
                                                  <SearchGroupHeading label={group.label} />
                                                  {group.options.map(option => (
                                                      <CommandItem
                                                          key={`${group.label}-${option.pathname}`}
                                                          className={cn(
                                                              'e-cursor-pointer e-px-3 e-py-2',
                                                              'e-transition-colors',
                                                              'hover:e-bg-heavy-metal-700 aria-[selected=true]:e-bg-heavy-metal-600',
                                                          )}
                                                          keywords={option.value}
                                                          value={option.pathname}
                                                          onMouseDown={e => e.preventDefault()}
                                                          onSelect={() => onSelect(option)}
                                                      >
                                                          <SearchResultItem option={option} />
                                                      </CommandItem>
                                                  ))}
                                              </CommandGroup>
                                          ) : null,
                                      )
                                    : null}

                                {!isLoading && (
                                    <CommandEmpty className="e-w-full e-px-4 e-py-3 e-pb-1 e-text-sm e-text-heavy-metal-400">
                                        No results found
                                    </CommandEmpty>
                                )}
                            </CommandList>
                        </div>
                    </PopoverPrimitive.Content>
                </Command>
            </PopoverPrimitive.Root>
        </div>
    );
}
