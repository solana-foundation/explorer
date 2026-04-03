import { useHotkeys } from '@mantine/hooks';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '@shared/utils';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from 'cmdk';
import React, { useCallback, useRef } from 'react';
import { Search, X } from 'react-feather';

import type { SearchItem, SearchOptions } from '../lib/types';

export type BaseSearchProps = {
    value: string;
    open: boolean;
    results: SearchOptions[];
    isLoading: boolean;
    onValueChange: (value: string) => void;
    onOpenChange: (open: boolean) => void;
    onSelect: (option: SearchItem) => void;
    renderItem?: (option: SearchItem) => React.ReactNode;
};

export function BaseSearch({
    value,
    open,
    results,
    isLoading,
    onValueChange,
    onOpenChange,
    onSelect,
    renderItem,
}: BaseSearchProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasValue = value.length > 0;
    const hasResults = results.some(group => group.options.length > 0);

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
            if (open) return; // Delegate to cmdk
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                onOpenChange(true);
            }
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
                                value={value}
                                onValueChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                onFocus={() => {
                                    if (value.trim().length > 0) {
                                        onOpenChange(true);
                                    }
                                }}
                                onBlur={() => onOpenChange(false)}
                                placeholder="Search for blocks, accounts, transactions, programs, and tokens"
                                className={cn(
                                    'e-w-full e-min-w-0 e-flex-1',
                                    'e-border-none e-bg-transparent e-outline-none',
                                    'e-text-sm e-text-white placeholder:e-text-heavy-metal-100',
                                    'e-overflow-hidden e-text-ellipsis',
                                )}
                            />
                            {hasValue ? (
                                <button
                                    type="button"
                                    aria-label="Clear search"
                                    onMouseDown={e => {
                                        e.preventDefault();
                                        handleClear();
                                    }}
                                    className={cn(
                                        'e-flex e-h-6 e-w-6 e-shrink-0 e-cursor-pointer e-items-center e-justify-center',
                                        'e-appearance-none e-rounded e-border e-border-solid e-border-heavy-metal-950 e-bg-heavy-metal-700 e-p-0',
                                        'e-text-heavy-metal-100 e-transition-colors hover:e-text-heavy-metal-400',
                                    )}
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
                    {/* cmdk requires a CommandList to be mounted at all times; render a hidden one when the popover is closed */}
                    {!open && <CommandList aria-hidden="true" className="e-hidden" />}
                    <PopoverPrimitive.Content
                        asChild
                        align="start"
                        sideOffset={4}
                        onOpenAutoFocus={e => e.preventDefault()}
                        onInteractOutside={e => {
                            if (e.target instanceof Element && e.target === inputRef.current) {
                                e.preventDefault();
                            }
                        }}
                        className={cn(
                            'e-z-10 e-rounded-md e-shadow-2xl [border-style:solid]',
                            'e-w-[var(--radix-popover-trigger-width)]',
                            'e-border e-border-heavy-metal-950 e-bg-heavy-metal-800',
                        )}
                    >
                        <CommandList
                            onMouseDown={e => {
                                // Prevent closing when clicking on scrollbar
                                if (e.target === e.currentTarget) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            }}
                            className={cn(
                                'e-max-h-96 e-overflow-y-auto e-overflow-x-hidden e-py-2',
                                '[&::-webkit-scrollbar]:e-w-2',
                                '[&::-webkit-scrollbar-thumb]:e-rounded-full [&::-webkit-scrollbar-thumb]:e-bg-heavy-metal-600 [&::-webkit-scrollbar-thumb]:hover:e-bg-heavy-metal-500',
                                '[&::-webkit-scrollbar-track]:e-rounded-md [&::-webkit-scrollbar-track]:e-bg-heavy-metal-800',
                            )}
                        >
                            {isLoading && (
                                <Command.Loading className="e-px-4 e-py-2 e-text-sm e-text-heavy-metal-400">
                                    loading...
                                </Command.Loading>
                            )}
                            {!isLoading && hasResults
                                ? results.map(group =>
                                      group.options.length > 0 ? (
                                          <CommandGroup
                                              key={group.label}
                                              heading={group.label}
                                              className={cn(
                                                  '[&_[cmdk-group-heading]]:e-mb-1 [&_[cmdk-group-heading]]:e-mt-2 [&_[cmdk-group-heading]]:e-select-none',
                                                  '[&_[cmdk-group-heading]]:e-px-3 [&_[cmdk-group-heading]]:e-pb-0.5 [&_[cmdk-group-heading]]:e-pt-0',
                                                  '[&_[cmdk-group-heading]]:e-text-[11.25px] [&_[cmdk-group-heading]]:e-font-medium [&_[cmdk-group-heading]]:e-uppercase',
                                                  '[&_[cmdk-group-heading]]:e-text-[#999]',
                                              )}
                                          >
                                              {group.options.map(option => (
                                                  <CommandItem
                                                      key={`${group.label}-${option.pathname}`}
                                                      value={option.pathname}
                                                      onMouseDown={e => e.preventDefault()}
                                                      onSelect={() => onSelect(option)}
                                                      keywords={option.value}
                                                      className={cn(
                                                          'e-cursor-pointer e-px-3 e-py-2',
                                                          'e-text-[15px] e-text-white e-transition-colors',
                                                          'hover:e-bg-heavy-metal-700 aria-[selected=true]:e-bg-heavy-metal-600',
                                                      )}
                                                  >
                                                      {renderItem ? renderItem(option) : option.label}
                                                  </CommandItem>
                                              ))}
                                          </CommandGroup>
                                      ) : null,
                                  )
                                : null}
                            {!isLoading ? (
                                <CommandEmpty className="e-w-full e-px-4 e-py-2 e-text-sm e-text-heavy-metal-400">
                                    No Results
                                </CommandEmpty>
                            ) : null}
                        </CommandList>
                    </PopoverPrimitive.Content>
                </Command>
            </PopoverPrimitive.Root>
        </div>
    );
}
