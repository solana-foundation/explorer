'use client';

import { type RefObject, useCallback, useEffect, useRef } from 'react';

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar']);

/**
 * Keeps a growing element pinned near the viewport bottom, yielding to the reader: while `follow`,
 * eases the page each frame so the element's bottom stays ~`gap`px above the fold; when `settle` flips
 * true, aligns once. Any manual scroll (wheel, touch, scroll keys) stops it for good.
 */
export function useStickToBottom(
    ref: RefObject<HTMLElement | null>,
    {
        follow,
        gap = 16,
        rate = 12,
        settle,
        smooth = true,
    }: { follow: boolean; gap?: number; rate?: number; settle: boolean; smooth?: boolean },
) {
    const userScrolled = useRef(false);

    useEffect(() => {
        const takeOver = () => {
            userScrolled.current = true;
        };
        const onKey = (event: KeyboardEvent) => {
            if (SCROLL_KEYS.has(event.key)) userScrolled.current = true;
        };
        window.addEventListener('wheel', takeOver, { passive: true });
        window.addEventListener('touchmove', takeOver, { passive: true });
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('wheel', takeOver);
            window.removeEventListener('touchmove', takeOver);
            window.removeEventListener('keydown', onKey);
        };
    }, []);

    const overshoot = useCallback(() => {
        const box = ref.current;
        return box ? box.getBoundingClientRect().bottom - (window.innerHeight - gap) : 0;
    }, [ref, gap]);

    useEffect(() => {
        if (!follow) return;
        let frame = 0;
        let last = 0;
        const step = (now: number) => {
            if (userScrolled.current) return;
            const dt = last === 0 ? 1 / 60 : Math.min((now - last) / 1000, 1 / 20);
            last = now;
            const delta = overshoot();
            if (delta > 0.5) window.scrollBy(0, delta * (1 - Math.exp(-dt * rate)));
            frame = requestAnimationFrame(step);
        };
        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [follow, overshoot, rate]);

    useEffect(() => {
        if (!settle || userScrolled.current) return;
        const delta = overshoot();
        if (delta > 0) window.scrollBy({ behavior: smooth ? 'smooth' : 'auto', top: delta });
    }, [settle, overshoot, smooth]);
}
