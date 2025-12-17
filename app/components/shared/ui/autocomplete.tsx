import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from 'cmdk';
import { useEffect, useRef, useState } from 'react';

import { cn } from '../utils';
import { Input, type InputProps } from './input';

export type Value = string;

export type AutocompleteItem = {
    value: Value;
    label: string;
    group?: string;
    keywords?: string[];
};

type AutocompleteProps<Item extends AutocompleteItem = AutocompleteItem> = {
    value: Value;
    onChange: (value: Value) => void;
    items: Item[];
    loading?: boolean;
    emptyMessage?: string;
    renderItemContent?: (option: Item) => React.ReactNode;
    renderItemLabel?: (option: Item) => React.ReactNode;
    label?: string;
    inputProps?: Pick<InputProps, 'ref' | 'aria-invalid' | 'variant' | 'placeholder'>;
    onInputIdReady?: (id: string) => void;
};

function Autocomplete<Item extends AutocompleteItem = AutocompleteItem>({
    value,
    onChange,
    items,
    loading,
    emptyMessage = 'No items.',
    renderItemContent,
    renderItemLabel,
    label,
    inputProps,
    onInputIdReady,
}: AutocompleteProps<Item>) {
    const [open, setOpen] = useState(false);

    const ungroupedItems = items.filter(item => !item.group);

    const groupedItems = items
        .filter((item): item is Item & { group: string } => Boolean(item.group))
        .reduce((groups, item) => {
            if (!groups.has(item.group)) {
                groups.set(item.group, []);
            }
            groups.get(item.group)?.push(item);
            return groups;
        }, new Map<string, Item[]>());

    const handleSelectItem = (inputValue: string) => {
        onChange(inputValue);
        setOpen(false);
    };

    const handleMouseDown = () => {
        setOpen(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (open) return; // Delegate to cmdk for handling everything
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            setOpen(true);
        }
    };

    const handleValueChange = (value: string) => {
        onChange(value);
        setOpen(true);
    };

    const handleBlur = () => {
        setOpen(false);
    };

    // Why? There is no way to get the id of the input element from the command input component OR provide it as a prop.
    // The implementation uses private context value. Providing it as a prop would break the implementation.
    const inptutRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (!inptutRef.current?.id) return;
        onInputIdReady?.(inptutRef.current.id);
    }, [onInputIdReady]);

    return (
        <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
            <Command shouldFilter label={label}>
                <PopoverPrimitive.Anchor asChild>
                    <Command.Input
                        asChild
                        value={value}
                        onValueChange={handleValueChange}
                        onKeyDown={handleKeyDown}
                        onMouseDown={handleMouseDown}
                        onBlur={handleBlur}
                        variant={'dark'}
                        {...inputProps}
                    >
                        <Input ref={inptutRef} />
                    </Command.Input>
                </PopoverPrimitive.Anchor>
                {!open && <CommandList aria-hidden="true" className="hidden" />}
                <PopoverPrimitive.Content
                    asChild
                    align="start"
                    sideOffset={6}
                    onOpenAutoFocus={e => e.preventDefault()}
                    onInteractOutside={e => {
                        if (e.target instanceof Element && e.target.hasAttribute('cmdk-input')) {
                            e.preventDefault();
                        }
                    }}
                    className="e-z-10 e-min-w-[var(--radix-popover-trigger-width)]"
                >
                    <CommandList
                        className={cn(
                            'e-max-h-96 e-overflow-y-auto e-overflow-x-hidden e-rounded',
                            'e-py-2',
                            'e-bg-heavy-metal-800',
                            'e-border e-border-heavy-metal-950',
                            'e-shadow'
                        )}
                    >
                        {loading && (
                            <Command.Loading className="e-px-4 e-py-2 e-text-sm e-text-heavy-metal-400">
                                Loading...
                            </Command.Loading>
                        )}
                        {!loading && items.length > 0 ? (
                            <>
                                {ungroupedItems.length > 0 && (
                                    <CommandGroup>
                                        {ungroupedItems.map(option => (
                                            <AutocompleteItemComponent<Item>
                                                key={option.value}
                                                onSelectItem={handleSelectItem}
                                                option={option}
                                                renderItemContent={renderItemContent}
                                                renderItemLabel={renderItemLabel}
                                            />
                                        ))}
                                    </CommandGroup>
                                )}
                                {Array.from(groupedItems.entries()).map(([groupName, groupItems]) => (
                                    <CommandGroup
                                        key={groupName}
                                        heading={groupName}
                                        className={cn(
                                            '[&_[cmdk-group-heading]]:e-px-4 [&_[cmdk-group-heading]]:e-py-1',
                                            '[&_[cmdk-group-heading]]:e-text-[10px] [&_[cmdk-group-heading]]:e-font-medium [&_[cmdk-group-heading]]:e-text-heavy-metal-400',
                                            '[&_[cmdk-group-heading]]:e-select-none [&_[cmdk-group-heading]]:e-uppercase [&_[cmdk-group-heading]]:e-tracking-wider'
                                        )}
                                    >
                                        {groupItems.map(option => (
                                            <AutocompleteItemComponent<Item>
                                                key={option.value}
                                                onSelectItem={handleSelectItem}
                                                option={option}
                                                renderItemContent={renderItemContent}
                                                renderItemLabel={renderItemLabel}
                                            />
                                        ))}
                                    </CommandGroup>
                                ))}
                            </>
                        ) : null}
                        {!loading ? (
                            <CommandEmpty className="e-w-full e-px-4 e-py-2 e-text-sm e-text-heavy-metal-400">
                                {emptyMessage}
                            </CommandEmpty>
                        ) : null}
                    </CommandList>
                </PopoverPrimitive.Content>
            </Command>
        </PopoverPrimitive.Root>
    );
}
Autocomplete.displayName = 'Autocomplete';

type AutocompleteItemProps<Item extends AutocompleteItem = AutocompleteItem> = {
    option: Item;
    onSelectItem: (value: Value) => void;
    renderItemContent?: (option: Item) => React.ReactNode;
    renderItemLabel?: (option: Item) => React.ReactNode;
};

function AutocompleteItemComponent<Item extends AutocompleteItem = AutocompleteItem>({
    option,
    onSelectItem,
    renderItemContent,
    renderItemLabel,
}: AutocompleteItemProps<Item>) {
    return (
        <CommandItem
            value={option.value}
            onMouseDown={e => e.preventDefault()}
            onSelect={() => onSelectItem(option.value)}
            keywords={option.keywords}
            className={cn(
                'e-cursor-pointer',
                'hover:e-bg-heavy-metal-700',
                'e-transition-colors',
                'aria-[selected=true]:e-bg-heavy-metal-600'
            )}
        >
            {renderItemContent
                ? renderItemContent(option)
                : renderItemContentDefault(option, renderItemLabel ?? renderItemLabelDefault)}
        </CommandItem>
    );
}

function renderItemContentDefault<Item extends AutocompleteItem = AutocompleteItem>(
    option: Item,
    renderItemLabel: (option: Item) => React.ReactNode
) {
    return (
        <div className="e-flex e-w-full e-items-center e-justify-between e-px-4 e-py-1.5 e-text-xs">
            {renderItemLabel(option)}
            <span className="e-font-mono e-text-xs e-text-white md:e-ml-2 md:e-text-heavy-metal-400">
                {option.value}
            </span>
        </div>
    );
}

function renderItemLabelDefault<Item extends AutocompleteItem>(option: Item) {
    return <span className="e-hidden md:e-inline">{option.label}</span>;
}

export { Autocomplete };
