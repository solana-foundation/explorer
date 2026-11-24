'use client';

import { cva } from 'class-variance-authority';
import { useCallback, useRef } from 'react';

import { useEdgeFades } from '@/app/shared/lib/use-edge-fades';
import { useTablistKeyboard } from '@/app/shared/lib/use-tablist-keyboard';

// Tabs for a card's header row. `mono` is the MCP docs look (mono capitals, accent active tab); `plain` keeps the
// same height but takes the app's regular tabs' font and colors.
export function CardTabs({
    items,
    onChange,
    value,
    look = 'mono',
}: {
    items: { id: string; label: string }[];
    onChange: (id: string) => void;
    value: string;
    look?: 'mono' | 'plain';
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

    const { onKeyDown, setTabRef } = useTablistKeyboard<HTMLButtonElement>(
        items.length,
        items.findIndex(item => item.id === value),
        index => {
            const item = items.at(index);
            if (item) onChange(item.id);
        },
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
                        ref={setTabRef(index)}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        tabIndex={active ? 0 : -1}
                        onClick={() => onChange(item.id)}
                        className={tabVariants({ active, look })}
                    >
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}

const tabVariants = cva(
    'flex shrink-0 cursor-pointer items-center whitespace-nowrap border-0 border-solid bg-transparent px-0 transition-colors',
    {
        compoundVariants: [
            { active: true, class: 'border-dark-accent text-dark-accent', look: 'mono' },
            {
                active: false,
                class: 'border-transparent text-heavy-metal-500 hover:text-heavy-metal-300',
                look: 'mono',
            },
            { active: true, class: 'border-accent text-white', look: 'plain' },
            { active: false, class: 'border-transparent text-outer-space-200', look: 'plain' },
        ],
        variants: {
            active: { false: '', true: '' },
            look: {
                mono: 'border-b-2 pb-2.5 pt-3 font-mono text-xs uppercase tracking-widest',
                // 48px tall to match the Metadata card's header (4px more each side than `mono`).
                plain: 'border-b pb-[13px] pt-3.5 text-sm font-normal',
            },
        },
    },
);
