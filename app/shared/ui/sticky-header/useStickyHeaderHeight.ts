import { type RefObject, useEffect } from 'react';

/**
 * Measures the height of a sticky header element and writes it to the
 * `--sticky-header-height` CSS custom property on `<html>`. Used to
 * offset `scroll-margin-top` on anchor targets beneath the sticky header.
 */
export function useStickyHeaderHeight(ref: RefObject<HTMLElement | null>, enabled = true) {
    useEffect(() => {
        if (!enabled) return;
        const el = ref.current;
        if (!el) return;

        // Initial measurement (one-time getBoundingClientRect is acceptable)
        document.documentElement.style.setProperty('--sticky-header-height', `${el.getBoundingClientRect().height}px`);

        const resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            // borderBoxSize avoids a forced reflow; fall back to contentRect for older browsers
            const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
            document.documentElement.style.setProperty('--sticky-header-height', `${height}px`);
        });
        resizeObserver.observe(el, { box: 'border-box' });

        return () => {
            resizeObserver.disconnect();
            document.documentElement.style.removeProperty('--sticky-header-height');
        };
        // ref is a stable RefObject from useRef — safe to omit from deps
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);
}
