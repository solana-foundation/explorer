import React from 'react';

// Distance (px) over which each edge fade eases in/out.
const FADE_RAMP = 24;

type EdgeFadesAxis = 'horizontal' | 'vertical';

/**
 * Background-agnostic edge fades on a scroll container: a mask-image dissolves the content to
 * transparent at whichever end still has hidden content, so it works on any background. Each end
 * ramps over {@link FADE_RAMP}, proportional to how far that end is scrolled away — a fresh edge
 * fades in as you scroll, and an edge with nothing behind it stays fully opaque.
 *
 * `axis` picks the scroll direction: `'vertical'` (top/bottom, the default) or `'horizontal'`
 * (left/right). `enabled` re-measures when it flips true — e.g. a drawer opening or a tab row
 * mounting. Returns a callback ref for the content wrapper; attaching a ResizeObserver there
 * refreshes the fades when the content's size changes (which `onScroll` alone never catches). When
 * the scroll container is also the content (a self-scrolling row), point both refs at it.
 */
export function useEdgeFades(
    scrollRef: React.RefObject<HTMLDivElement | null>,
    enabled: boolean,
    axis: EdgeFadesAxis = 'vertical',
): { contentRef: (node: HTMLDivElement | null) => void; maskImage: string; onScroll: () => void } {
    const [startFade, setStartFade] = React.useState(0);
    const [endFade, setEndFade] = React.useState(0);

    const updateFades = React.useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        const [scrolled, scrollSize, clientSize] =
            axis === 'horizontal'
                ? [el.scrollLeft, el.scrollWidth, el.clientWidth]
                : [el.scrollTop, el.scrollHeight, el.clientHeight];
        setStartFade(Math.min(1, scrolled / FADE_RAMP));
        const fromEnd = scrollSize - scrolled - clientSize;
        setEndFade(Math.min(1, Math.max(0, fromEnd) / FADE_RAMP));
    }, [scrollRef, axis]);

    // Callback ref rather than a mount effect: a consumer (e.g. a Radix sheet body) may mount the
    // content node only later, so a ref+effect keyed on mount would attach the observer while the
    // node is still null and never reattach. The callback fires whenever the node mounts/unmounts.
    const observer = React.useRef<ResizeObserver | null>(null);
    const contentRef = React.useCallback(
        (node: HTMLDivElement | null) => {
            observer.current?.disconnect();
            if (!node || typeof ResizeObserver === 'undefined') return;
            observer.current = new ResizeObserver(() => updateFades());
            observer.current.observe(node);
        },
        [updateFades],
    );

    React.useEffect(() => {
        updateFades();
    }, [enabled, updateFades]);

    const direction = axis === 'horizontal' ? 'to right' : 'to bottom';
    const maskImage = `linear-gradient(${direction}, rgba(0,0,0,${1 - startFade}) 0, #000 ${FADE_RAMP}px, #000 calc(100% - ${FADE_RAMP}px), rgba(0,0,0,${1 - endFade}) 100%)`;

    return { contentRef, maskImage, onScroll: updateFades };
}
