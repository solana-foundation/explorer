'use client';

import { type RefObject, useCallback, useEffect, useState } from 'react';

import { useStickyHeaderHeight } from '@/app/shared/ui/sticky-header/useStickyHeaderHeight';

const SCROLL_OFFSET = 10;

export function useScrollSpy({
    enabled,
    fallbackRef,
    paths,
    wrapperRef,
}: {
    enabled: boolean;
    fallbackRef?: RefObject<HTMLElement | null>;
    paths: string[];
    wrapperRef: RefObject<HTMLElement | null>;
}) {
    const [stuck, setStuck] = useState(false);
    const [active, setActive] = useState(() => paths[0] ?? '');

    const scrollToSection = useCallback(
        (path: string) => {
            const target = document.getElementById(path);
            const headerEl = wrapperRef.current ?? fallbackRef?.current;
            if (!target || !headerEl) return;
            const offset = headerEl.getBoundingClientRect().height;
            let naturalTop = 0;
            let el: HTMLElement | null = target;
            while (el) {
                naturalTop += el.offsetTop;
                el = el.offsetParent as HTMLElement | null;
            }
            window.scrollTo({
                behavior: 'smooth',
                top: naturalTop - offset - SCROLL_OFFSET,
            });
        },
        [wrapperRef, fallbackRef],
    );

    useStickyHeaderHeight(wrapperRef, enabled);

    useEffect(() => {
        if (!enabled) return;
        const update = () => {
            const rect = wrapperRef.current?.getBoundingClientRect();
            // Stuck = the sticky bar has reached the top of the viewport (top: 0). Deriving this from the
            // bar's vertical position — rather than an IntersectionObserver with threshold 1 — keeps the
            // shadow correct even when the bar is full-bleed (100vw): a hairline of horizontal overflow
            // would otherwise drop the intersection ratio below 1 and pin `stuck` on permanently.
            if (rect) setStuck(rect.top <= 0);

            const barHeight = rect?.height ?? fallbackRef?.current?.getBoundingClientRect().height ?? 0;
            // Activate when the section is in the upper third of the visible content area.
            const threshold = window.scrollY + barHeight + window.innerHeight * 0.3;
            let current = paths[0] ?? '';
            for (const path of paths) {
                const el = document.getElementById(path);
                if (el && el.getBoundingClientRect().top + window.scrollY <= threshold) {
                    current = path;
                }
            }
            setActive(current);
        };
        window.addEventListener('scroll', update, { passive: true });
        update();
        return () => window.removeEventListener('scroll', update);
    }, [enabled, paths, wrapperRef, fallbackRef]);

    return { active, scrollToSection, stuck };
}
