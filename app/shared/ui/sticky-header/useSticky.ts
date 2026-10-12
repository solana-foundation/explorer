import { type RefObject, useEffect, useRef, useState } from 'react';

import { useStickyHeaderHeight } from './useStickyHeaderHeight';

/**
 * Drives a full-bleed sticky bar. Tracks whether the bar has "stuck" to the top of the viewport
 * (so the caller can fade in a shadow) and publishes its height via `useStickyHeaderHeight`, so
 * anchored sections beneath it can offset their `scroll-margin-top`.
 *
 * Returns the ref to attach to the sticky wrapper and the current `stuck` state. When `enabled`
 * is false the hook is inert and `stuck` stays `false`.
 */
export function useSticky(enabled: boolean): { stuck: boolean; wrapperRef: RefObject<HTMLDivElement | null> } {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [stuck, setStuck] = useState(false);

    useEffect(() => {
        if (!enabled) return;
        const update = () => {
            // Stuck = the sticky bar has reached the top of the viewport (top: 0). Deriving this from the
            // bar's vertical position — rather than an IntersectionObserver with threshold 1 — keeps the
            // shadow correct even when the bar is full-bleed (100vw): a hairline of horizontal overflow
            // would otherwise drop the intersection ratio below 1 and pin `stuck` on permanently.
            const el = wrapperRef.current;
            if (el) setStuck(el.getBoundingClientRect().top <= 0);
        };
        window.addEventListener('scroll', update, { passive: true });
        update();
        return () => window.removeEventListener('scroll', update);
    }, [enabled]);

    useStickyHeaderHeight(wrapperRef, enabled);

    return { stuck, wrapperRef };
}
