'use client';

import { cn } from '@components/shared/utils';
import { useHotkeys } from '@mantine/hooks';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from 'cmdk';
import React, { useCallback, useRef } from 'react';
import { Search, X } from 'react-feather';

import type { FilterId, FilterTab } from '../lib/filter-tabs';
import type { SearchItem, SearchOptions } from '../lib/types';
import { SearchFilters } from './SearchFilters';
import { SearchGroupHeading } from './SearchGroupHeading';
import { SearchResultItem } from './SearchResultItem';

export type { FilterId, FilterTab } from '../lib/filter-tabs';
export { FILTER_TABS } from '../lib/filter-tabs';

export type BaseSearchProps = {
    value: string;
    open: boolean;
    filteredResults: SearchOptions[];
    counts: Record<FilterId, number>;
    visibleTabs: FilterTab[];
    activeFilter: FilterId;
    isLoading: boolean;
    onValueChange: (value: string) => void;
    onOpenChange: (open: boolean) => void;
    onFilterChange: (filter: FilterId) => void;
    onSelect: (option: SearchItem) => void;
};

export function BaseSearch({
    value,
    open,
    filteredResults,
    counts,
    visibleTabs,
    activeFilter,
    isLoading,
    onValueChange,
    onOpenChange,
    onFilterChange,
    onSelect,
}: BaseSearchProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasValue = value.length > 0;
    const hasResults = filteredResults.some(g => g.options.length > 0);

    const handleInputChange = useCallback(
        (next: string) => {
            onValueChange(next);
            onOpenChange(next.trim().length > 0);
        },
        [onValueChange, onOpenChange],
    );

    const handleClear = useCallback(() => {
        onValueChange('');
        onOpenChange(false);
        inputRef.current?.blur();
    }, [onValueChange, onOpenChange]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Escape') {
                inputRef.current?.blur();
                onOpenChange(false);
                return;
            }
            if (open && e.key === 'Tab' && visibleTabs.length > 1) {
                e.preventDefault();
                const currentIndex = visibleTabs.findIndex(t => t.id === activeFilter);
                const nextIndex = e.shiftKey
                    ? (currentIndex - 1 + visibleTabs.length) % visibleTabs.length
                    : (currentIndex + 1) % visibleTabs.length;
                onFilterChange(visibleTabs[nextIndex].id);
                return;
            }
            if (open) return;
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') onOpenChange(true);
        },
        [open, visibleTabs, activeFilter, onFilterChange, onOpenChange],
    );

    useHotkeys(
        [
            ['/', () => inputRef.current?.focus()],
            ['mod+k', () => inputRef.current?.focus()],
        ],
        ['INPUT', 'TEXTAREA'],
    );

    return (
        <div className="w-full">
            <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
                <Command shouldFilter={false} label="Search">
                    <PopoverPrimitive.Anchor asChild>
                        <div
                            data-search-frame
                            className={cn(
                                'flex items-center gap-2.5',
                                'rounded-md border border-outer-space-700 bg-heavy-metal-800 [border-style:solid]',
                                'h-[38px] pl-2.5 pr-1.5 shadow-md',
                                'transition-shadow focus-within:shadow-[0_0_0.4rem_#00d18c]',
                            )}
                        >
                            <Search className="shrink-0 translate-x-px text-heavy-metal-100" size={15} />
                            <Command.Input
                                ref={inputRef}
                                autoFocus
                                className={cn(
                                    'w-full min-w-0 flex-1',
                                    'border-none bg-transparent outline-none',
                                    'text-sm text-white placeholder:text-heavy-metal-100',
                                    'overflow-hidden',
                                    '[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)]',
                                    '[mask-image:linear-gradient(to_right,#000_calc(100%-24px),transparent)]',
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
                                        'flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center',
                                        'appearance-none border-0 bg-transparent p-0',
                                        'text-heavy-metal-100 transition-colors hover:text-white',
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
                                        'hidden h-6 w-6 shrink-0 items-center justify-center [@media(pointer:fine)]:flex',
                                        'rounded border border-solid border-outer-space-600 bg-transparent',
                                        'text-sm text-heavy-metal-100',
                                    )}
                                >
                                    /
                                </kbd>
                            )}
                        </div>
                    </PopoverPrimitive.Anchor>

                    {!open && <CommandList aria-hidden="true" className="hidden" />}

                    <PopoverPrimitive.Content
                        asChild
                        align="start"
                        sideOffset={4}
                        data-search-panel
                        className={cn(
                            'z-50 rounded-md shadow-2xl [border-style:solid]',
                            'w-[var(--radix-popover-trigger-width)]',
                            'border border-outer-space-800 bg-outer-space-900',
                        )}
                        onInteractOutside={e => {
                            if (e.target instanceof Element && e.target === inputRef.current) e.preventDefault();
                        }}
                        onOpenAutoFocus={e => e.preventDefault()}
                    >
                        <div onMouseDown={event => event.preventDefault()}>
                            {/* Allow a single pill: hide-all rule can leave visibleTabs at length 1. */}
                            {hasResults && visibleTabs.length >= 1 && (
                                <SearchFilters
                                    activeFilter={activeFilter}
                                    counts={counts}
                                    tabs={visibleTabs}
                                    onFilterChange={onFilterChange}
                                />
                            )}

                            <CommandList
                                className={cn(
                                    'max-h-[420px] overflow-y-auto overflow-x-hidden p-1.5 pt-0',
                                    '[&::-webkit-scrollbar]:w-2',
                                    '[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-outer-space-600 [&::-webkit-scrollbar-thumb]:hover:bg-outer-space-500',
                                    '[&::-webkit-scrollbar-track]:rounded-md [&::-webkit-scrollbar-track]:bg-outer-space-900',
                                )}
                            >
                                {isLoading && (
                                    <Command.Loading className="px-4 py-3 pb-1 text-sm text-outer-space-300">
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
                                                              'cursor-pointer rounded-md px-3 py-2',
                                                              'border border-solid border-transparent',
                                                              'transition-colors',
                                                              'hover:bg-outer-space-800 aria-[selected=true]:bg-outer-space-800',
                                                              'aria-[selected=true]:border-white/10',
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
                                    <CommandEmpty className="w-full px-4 py-3 pb-1 text-sm text-outer-space-300">
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
