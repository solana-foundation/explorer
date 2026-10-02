'use client';

import { cn } from '@components/shared/utils';
import { useHotkeys } from '@mantine/hooks';
import React, { type ReactNode, type RefObject, useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Search, X } from 'react-feather';

const GROUND = 'oklch(30.098% 0.01205 160.58)';

const BELOW_DOCK =
    '[@media(max-width:575px)]:[&_kbd]:hidden [@media(max-width:575px)]:[&_[data-search-frame]]:!pr-[38px] [@media(max-width:575px)]:[&_[data-search-frame]>button]:!hidden';

const STRIP_SEARCH_FRAME =
    '[&_[data-search-frame]]:!border-0 [&_[data-search-frame]]:!bg-transparent [&_[data-search-frame]]:!shadow-none [&_[data-search-frame]]:focus-within:!shadow-none [&_[data-search-frame]>svg]:!text-white';

const ALIGN_SEARCH_PANEL =
    '[&_[data-search-panel]]:!-ml-px [&_[data-search-panel]]:!w-[calc(var(--radix-popover-trigger-width)+2px)]';

const FILL_SEARCH_HEIGHT = '[&>div]:h-full [&_[cmdk-root]]:h-full [&_[data-search-frame]]:!h-full';

export interface NavSearchProps {
    children: ReactNode;
    dockClassName?: string;
    onOpenChange: (open: boolean) => void;
    open: boolean;
    restClassName?: string;
    slotRef?: RefObject<HTMLElement | null>;
}

export function NavSearch({ children, dockClassName, onOpenChange, open, restClassName, slotRef }: NavSearchProps) {
    const fieldRef = useRef<HTMLDivElement>(null);
    const toggleRef = useRef<HTMLButtonElement>(null);
    const wasOpen = useRef(false);
    const [slotInsets, setSlotInsets] = useState<{ left: number; right: number } | undefined>(undefined);
    const [focused, setFocused] = useState(false);
    const [ringVisible, setRingVisible] = useState(false);
    const [hasText, setHasText] = useState(false);

    useEffect(() => {
        if (focused) {
            setRingVisible(true);
            return;
        }
        const timer = setTimeout(() => setRingVisible(false), 400);
        return () => clearTimeout(timer);
    }, [focused]);

    useEffect(() => {
        const slot = slotRef?.current;
        const row = slot?.offsetParent;
        if (!slot || !(row instanceof HTMLElement)) return;
        const measure = () =>
            setSlotInsets({ left: slot.offsetLeft, right: row.clientWidth - slot.offsetLeft - slot.offsetWidth });
        measure();
        const observer = new ResizeObserver(measure);
        observer.observe(row);
        observer.observe(slot);
        return () => observer.disconnect();
    }, [slotRef]);

    const litRule: React.CSSProperties | undefined =
        open || ringVisible
            ? {
                  backgroundClip: 'padding-box, border-box',
                  backgroundImage: [
                      `linear-gradient(${GROUND}, ${GROUND})`,
                      'radial-gradient(118% 130% at 0% 100%, rgba(29,215,155,0.53) 0%, rgba(29,215,155,0.46) 35%, rgba(29,215,155,0.4) 65%, rgba(29,215,155,0.34) 90%, rgba(29,215,155,0.31) 100%)',
                  ].join(', '),
                  backgroundOrigin: 'border-box',
                  backgroundPosition: '0 0, left bottom',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '100% 100%, 100% 100%',
                  borderColor: focused ? 'transparent' : undefined,
                  transitionDuration: focused ? '300ms, 300ms, 100ms' : '300ms, 300ms, 400ms',
                  transitionProperty: 'left, right, border-color',
              }
            : undefined;

    const frameClasses = cn(
        'rounded-md border border-solid border-outer-space-700',
        open ? 'bg-heavy-metal-800' : 'bg-heavy-metal-800 hover:border-outer-space-600',
    );

    useEffect(() => {
        const field = fieldRef.current;
        if (!field) return;
        const sync = () => setHasText(Boolean(field.querySelector('input')?.value));
        sync();
        field.addEventListener('input', sync);
        return () => field.removeEventListener('input', sync);
    }, [open]);

    const clearOrClose = useCallback(() => {
        const input = fieldRef.current?.querySelector('input');
        if (!input?.value) {
            onOpenChange(false);
            return;
        }
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(input, '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.focus();
    }, [onOpenChange]);

    const openNow = useCallback(() => {
        flushSync(() => onOpenChange(true));
        fieldRef.current?.querySelector('input')?.focus();
    }, [onOpenChange]);

    useEffect(() => {
        if (!open && wasOpen.current) toggleRef.current?.focus();
        wasOpen.current = open;
    }, [open]);

    useHotkeys(
        [
            ['/', openNow],
            ['mod+k', openNow],
        ],
        ['INPUT', 'TEXTAREA'],
    );

    return (
        <div
            ref={fieldRef}
            onKeyDown={event => {
                if (event.key === 'Escape') onOpenChange(false);
            }}
            onFocus={event => {
                if (!toggleRef.current?.contains(event.target)) setFocused(true);
            }}
            onBlur={event => {
                const next = event.relatedTarget;
                const stillLit = event.currentTarget.contains(next) && !toggleRef.current?.contains(next);
                if (!stillLit) setFocused(false);
                if (event.currentTarget.contains(next)) return;
                if (open && !fieldRef.current?.querySelector('input')?.value) onOpenChange(false);
            }}
            style={{
                ...litRule,
                ...(!open && slotInsets ? { left: slotInsets.left, right: slotInsets.right } : undefined),
            }}
            className={cn(
                'absolute bottom-0 top-0 z-10 flex items-center overflow-hidden',
                'transition-[left,right,background-color,border-color] duration-300 ease-out motion-reduce:transition-none',
                slotRef && !slotInsets && !restClassName && 'invisible',
                frameClasses,
                'sm:relative sm:inset-auto sm:h-[38px] sm:min-w-0 sm:flex-1 sm:bg-heavy-metal-800',
                dockClassName,
                open ? 'left-4 right-4 lg:left-6 lg:right-6' : restClassName,
            )}
        >
            <div
                className={cn(
                    'relative min-w-0 flex-1 self-stretch',
                    FILL_SEARCH_HEIGHT,
                    STRIP_SEARCH_FRAME,
                    ALIGN_SEARCH_PANEL,
                    BELOW_DOCK,
                    open ? 'block' : 'hidden',
                    'sm:block',
                )}
            >
                {children}
            </div>

            <button
                ref={toggleRef}
                type="button"
                aria-label={open ? (hasText ? 'Clear search' : 'Close search') : 'Open search'}
                aria-expanded={open}
                onMouseDown={event => open && event.preventDefault()}
                onClick={() => (open ? clearOrClose() : openNow())}
                className={cn(
                    'absolute inset-y-0 right-0 z-10 flex w-9 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-white transition-colors hover:text-heavy-metal-100',
                    'sm:hidden',
                )}
            >
                <span className="relative block h-[18px] w-[18px]">
                    <Search
                        size={18}
                        aria-hidden
                        className={cn(
                            'absolute inset-0 transition-[opacity,transform] duration-200 motion-reduce:transition-none',
                            open ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100',
                        )}
                    />
                    <X
                        size={18}
                        aria-hidden
                        className={cn(
                            'absolute inset-0 transition-[opacity,transform] duration-200 motion-reduce:transition-none',
                            open ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0',
                        )}
                    />
                </span>
            </button>
        </div>
    );
}
