'use client';

import { useEffect, useRef } from 'react';

// Mobile-only sticky tab strip. While scrolling a section its tab strip pins to the top of the window; once
// less than `tailPx` is left below the strip to the section's end, it detaches and scrolls away — kept
// `position: sticky` but with `top` driven negative, so it re-pins on the way back up and its
// box/width/horizontal-scroll are preserved. Desktop (>= sm) leaves the strip static.
export function useStickyRelease(tailPx = 320) {
    const sectionRef = useRef<HTMLDivElement | null>(null);
    const stripRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 575.98px)');
        let raf = 0;
        const update = () => {
            raf = 0;
            const section = sectionRef.current;
            const strip = stripRef.current;
            if (!section || !strip) return;
            if (!mq.matches) {
                strip.style.top = '';
                return;
            }
            const rect = section.getBoundingClientRect();
            const threshold = tailPx + strip.offsetHeight;
            strip.style.top = rect.bottom < threshold ? `${Math.round(rect.bottom - threshold)}px` : '0px';
        };
        const onScroll = () => {
            if (!raf) raf = requestAnimationFrame(update);
        };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        mq.addEventListener('change', onScroll);
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            mq.removeEventListener('change', onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, [tailPx]);

    return { sectionRef, stripRef };
}

// On tab switch, pull the section's top up to the top of the window — but only if it has scrolled above the
// viewport (you're inside/past the section). If the section top is still at or below the viewport top (you're
// above it), leave the scroll alone. Uses `window.scrollTo` (not `scrollIntoView`, which wouldn't move the
// page here) and defers a frame so it lands after the tab click's own focus-into-view scroll.
export function scrollSectionToTop(el: HTMLElement | null) {
    if (!el) return;
    requestAnimationFrame(() => {
        const rectTop = el.getBoundingClientRect().top;
        if (rectTop >= 0) return;
        window.scrollTo({ behavior: 'instant', top: window.scrollY + rectTop });
    });
}
