import React from "react";

// Downward drag past this (px) dismisses the sheet on release.
const DISMISS_THRESHOLD = 80;

type PointerHandlers = {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
};

/**
 * Swipe-to-dismiss. Drag the grab handle — or pull the scroll body while it's at the very top —
 * downward past {@link DISMISS_THRESHOLD} to close. Pointer (not touch) events so mouse + touch both
 * work; pointer capture keeps move/up firing once the pointer leaves the grab zone.
 *
 * Returns handler bags for the two grab zones plus the live `dragY` offset and whether a drag is
 * active (so the surface can suppress its transition while dragging).
 */
export function useSwipeToDismiss(
    scrollRef: React.RefObject<HTMLDivElement | null>,
    onDismiss: () => void,
): { dragY: number; dragging: boolean; handleProps: PointerHandlers; bodyProps: PointerHandlers } {
    const dragStartY = React.useRef<number | undefined>(undefined);
    const [dragY, setDragY] = React.useState(0);
    const [dragging, setDragging] = React.useState(false);

    const end = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragStartY.current === undefined) return;
        if (dragY > DISMISS_THRESHOLD) onDismiss();
        dragStartY.current = undefined;
        setDragging(false);
        setDragY(0);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const handleProps: PointerHandlers = {
        onPointerCancel: end,
        onPointerDown: e => {
            dragStartY.current = e.clientY;
            setDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
        },
        onPointerMove: e => {
            if (dragStartY.current === undefined) return;
            // Downward only — dragging up clamps to 0.
            setDragY(Math.max(0, e.clientY - dragStartY.current));
        },
        onPointerUp: end,
    };

    // Pull-to-close from the scroll region: arm on pointer-down at scrollTop 0, but only take over the
    // gesture once we see downward movement — otherwise native vertical scroll keeps working.
    const bodyProps: PointerHandlers = {
        onPointerCancel: end,
        onPointerDown: e => {
            if ((scrollRef.current?.scrollTop ?? 0) > 0) return;
            dragStartY.current = e.clientY;
        },
        onPointerMove: e => {
            if (dragStartY.current === undefined) return;
            const delta = e.clientY - dragStartY.current;
            if (!dragging) {
                if (delta > 0 && (scrollRef.current?.scrollTop ?? 0) <= 0) {
                    setDragging(true);
                    e.currentTarget.setPointerCapture(e.pointerId);
                } else {
                    // Upward, or the content has scrolled — let native scroll take over.
                    dragStartY.current = undefined;
                    return;
                }
            }
            setDragY(Math.max(0, delta));
        },
        onPointerUp: end,
    };

    return { bodyProps, dragY, dragging, handleProps };
}