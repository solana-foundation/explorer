'use client';

import { useCallback, useRef } from 'react';

import { cn } from '@/app/components/shared/utils';
import { useEdgeFades } from '@/app/shared/lib/use-edge-fades';
import { useTablistKeyboard } from '@/app/shared/lib/use-tablist-keyboard';

export function CardTabs({
    items,
    onChange,
    value,
}: {
    items: { id: string; label: string }[];
    onChange: (id: string) => void;
    value: string;
}) {
    const rowRef = useRef<HTMLDivElement>(null);
    const { contentRef, maskImage, onScroll } = useEdgeFades(rowRef, true, 'horizontal');
    const setRow = useCallback(
        (node: HTMLDivElement | null) => {
            rowRef.current = node;
            contentRef(node);
        },
        [contentRef],
    );

    const { onKeyDown, tabRefs } = useTablistKeyboard<HTMLButtonElement>(
        items.length,
        items.findIndex(item => item.id === value),
        index => onChange(items[index].id),
    );

    return (
        <div
            ref={setRow}
            role="tablist"
            onScroll={onScroll}
            onKeyDown={onKeyDown}
            className="flex min-w-0 flex-1 items-stretch gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{ WebkitMaskImage: maskImage, maskImage }}
        >
            {items.map((item, index) => {
                const active = item.id === value;
                return (
                    <button
                        key={item.id}
                        ref={node => {
                            tabRefs.current[index] = node;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(item.id)}
                        className={cn(
                            'flex shrink-0 cursor-pointer items-center whitespace-nowrap border-0 border-b-2 border-solid bg-transparent px-0 pb-2.5 pt-3 font-mono text-xs uppercase tracking-widest transition-colors',
                            active
                                ? 'border-dark-accent text-dark-accent'
                                : 'border-transparent text-heavy-metal-500 hover:text-heavy-metal-300',
                        )}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}
