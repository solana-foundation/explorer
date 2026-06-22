// TODO(fsd): relocate this module to @shared or the appropriate feature/entity layer.
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cva } from 'class-variance-authority';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from 'cmdk';
import { useEffect, useRef, useState } from 'react';

import { Input, type InputProps } from './input';

export type Value = string;

export type AutocompleteItem = {
    value: Value;
    label: string;
    group?: string;
    keywords?: string[];
};

const commandListVariants = cva(['max-h-96 overflow-x-hidden overflow-y-auto py-2'], {
    defaultVariants: {
        scrollbar: 'styled',
    },
    variants: {
        scrollbar: {
            styled: [
                '[&::-webkit-scrollbar]:w-2',
                '[&::-webkit-scrollbar-thumb]:bg-heavy-metal-600',
                '[&::-webkit-scrollbar-thumb]:rounded-full',
                '[&::-webkit-scrollbar-thumb]:transition-colors',
                '[&::-webkit-scrollbar-thumb]:hover:bg-heavy-metal-500',
                '[&::-webkit-scrollbar-track]:bg-heavy-metal-800',
                '[&::-webkit-scrollbar-track]:rounded-md',
            ],
        },
    },
});

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
                    sideOffset={4}
                    onOpenAutoFocus={e => e.preventDefault()}
                    onInteractOutside={e => {
                        if (e.target instanceof Element && e.target.hasAttribute('cmdk-input')) {
                            e.preventDefault();
                        }
                    }}
                    className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[min(400px,100vw)] rounded-md border border-heavy-metal-900 bg-heavy-metal-800 shadow-2xl [border-style:solid]"
                >
                    <CommandList
                        onMouseDown={e => {
                            // Prevent closing when clicking on scrollbar
                            if (e.target === e.currentTarget) {
                                e.preventDefault();
                                e.stopPropagation();
                            }
                        }}
                        className={commandListVariants()}
                    >
                        {loading && (
                            <Command.Loading className="px-4 py-2 text-sm text-heavy-metal-400">
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
                                        className="[&_[cmdk-group-heading]]:mb-1 [&_[cmdk-group-heading]]:mt-2 [&_[cmdk-group-heading]]:select-none [&_[cmdk-group-heading]]:border-b [&_[cmdk-group-heading]]:border-heavy-metal-700 [&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:pt-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-heavy-metal-200"
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
                            <CommandEmpty className="w-full px-4 py-2 text-sm text-heavy-metal-400">
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
            className="cursor-pointer transition-colors hover:bg-heavy-metal-700 aria-[selected=true]:bg-heavy-metal-600"
        >
            {renderItemContent
                ? renderItemContent(option)
                : renderItemContentDefault(option, renderItemLabel ?? renderItemLabelDefault)}
        </CommandItem>
    );
}

function renderItemContentDefault<Item extends AutocompleteItem = AutocompleteItem>(
    option: Item,
    renderItemLabel: (option: Item) => React.ReactNode,
) {
    return (
        <div className="flex w-full items-center justify-between px-4 py-1.5 text-xs">
            {renderItemLabel(option)}
            <span className="font-mono text-xs text-white md:ml-2 md:text-heavy-metal-400">{option.value}</span>
        </div>
    );
}

function renderItemLabelDefault<Item extends AutocompleteItem>(option: Item) {
    return <span className="hidden md:inline">{option.label}</span>;
}

export { Autocomplete };
