import React from 'react';

// Distance (px) over which each edge fade eases in/out.
const FADE_RAMP = 24;

type EdgeFadesAxis = 'horizontal' | 'vertical';

/**
 * Masks each end of a scroll container that has hidden content, so it works on any background.
 * Attach `contentRef` to the content wrapper so size changes refresh the fades; a self-scrolling row takes both refs.
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
