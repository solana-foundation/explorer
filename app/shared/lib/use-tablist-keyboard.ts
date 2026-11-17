import 'client-only';

import { type KeyboardEvent, useRef } from 'react';

/**
 * ARIA tablist keyboard support: roving focus across the tabs with Arrow/Home/End.
 * Attach `onKeyDown` to the tablist container and `ref={setTabRef(i)}` to each tab
 * (with `tabIndex={active ? 0 : -1}`). `onSelect` fires with the target index —
 * activate that tab there (automatic activation); focus follows.
 */
export function useTablistKeyboard<T extends HTMLElement>(
    count: number,
    currentIndex: number,
    onSelect: (index: number) => void,
) {
    const tabs = useRef(new Map<number, T>());

    const setTabRef = (index: number) => (node: T | null) => {
        if (node) tabs.current.set(index, node);
        else tabs.current.delete(index);
    };

    const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
        // Modified arrows belong to the browser: Alt/Cmd+Arrow is back/forward.
        if (event.altKey || event.ctrlKey || event.metaKey) return;
        const focused = [...tabs.current].find(([, node]) => node === document.activeElement)?.[0];
        const current = focused ?? Math.max(0, currentIndex);
        let next = current;
        if (event.key === 'ArrowRight') next = (current + 1) % count;
        else if (event.key === 'ArrowLeft') next = (current - 1 + count) % count;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = count - 1;
        else return;
        event.preventDefault();
        onSelect(next);
        tabs.current.get(next)?.focus();
    };

    return { onKeyDown, setTabRef };
}
