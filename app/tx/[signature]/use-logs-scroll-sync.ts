import { RefObject, useEffect, useRef } from 'react';

export function useLogsPanelScrollSync({
    panelRef,
    enabled,
    watchValue,
    navThreshold = 80,
}: {
    panelRef: RefObject<HTMLDivElement | null>;
    enabled: boolean;
    watchValue?: unknown;
    navThreshold?: number;
}) {
    const isManualScrollRef = useRef(false);
    const manualScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!enabled) return;
        const logsPanel = panelRef.current;
        if (!logsPanel) return;

        // Compute title height once — it doesn't change while scrolling.
        const titleHeight = (logsPanel.querySelector('[data-section-title]') as HTMLElement | null)?.offsetHeight ?? 0;

        const handleWheel = (e: WheelEvent) => {
            const { scrollTop, scrollHeight, clientHeight } = logsPanel;
            const atTop = scrollTop === 0 && e.deltaY < 0;
            const atBottom = scrollTop + clientHeight >= scrollHeight && e.deltaY > 0;
            if (atTop || atBottom) return;
            e.preventDefault();
            logsPanel.scrollTop += e.deltaY;
            isManualScrollRef.current = true;
            if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current);
            manualScrollTimeoutRef.current = setTimeout(() => {
                isManualScrollRef.current = false;
            }, 2000);
        };

        const handlePageScroll = () => {
            if (isManualScrollRef.current) return;
            // Top-level ix-N cards only (excludes nested ix-N-M).
            const cards = Array.from(document.querySelectorAll<HTMLElement>('[id^="ix-"]')).filter(el => {
                const suffix = el.id.slice(3);
                return suffix.length > 0 && !suffix.includes('-') && !Number.isNaN(Number(suffix));
            });
            if (cards.length === 0) return;

            // Active = last card whose top has crossed the sticky nav threshold.
            let activeIndex = 0;
            for (let i = 0; i < cards.length; i++) {
                if (cards[i].getBoundingClientRect().top <= navThreshold) activeIndex = i;
                else break;
            }

            const cardRect = cards[activeIndex].getBoundingClientRect();
            const progress = Math.max(0, Math.min(1, (navThreshold - cardRect.top) / cardRect.height));

            const logRow = logsPanel.querySelector<HTMLElement>(`[data-ix-index="${activeIndex}"]`);
            if (!logRow) return;

            // Use getBoundingClientRect for position independent of current scrollTop.
            // Offset by the sticky title height so the row appears below it, not under it.
            const panelRect = logsPanel.getBoundingClientRect();
            const rowRect = logRow.getBoundingClientRect();
            const rowAbsoluteTop = rowRect.top - panelRect.top + logsPanel.scrollTop;
            logsPanel.scrollTop = Math.max(0, rowAbsoluteTop - titleHeight + rowRect.height * progress);
        };

        logsPanel.addEventListener('wheel', handleWheel, { passive: false });
        window.addEventListener('scroll', handlePageScroll, { passive: true });
        return () => {
            logsPanel.removeEventListener('wheel', handleWheel);
            window.removeEventListener('scroll', handlePageScroll);
            if (manualScrollTimeoutRef.current) clearTimeout(manualScrollTimeoutRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, watchValue, navThreshold]);
}
