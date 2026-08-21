import React from 'react';

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
 * On release past the threshold the sheet keeps sliding down from its current drag offset and only
 * dismisses once that transition finishes (via {@link onTransitionEnd}). While this is happening
 * `closing` is true so the caller can suppress the CSS out-keyframe — otherwise that keyframe, which
 * always restarts from the fully-open position, would snap the sheet back up before sliding it out.
 *
 * Returns handler bags for the two grab zones, the live `dragY` offset, whether a drag is active (so
 * the surface can suppress its transition while dragging), the `closing` flag, and the
 * `onTransitionEnd` handler the surface must wire up so the dismiss fires when the slide-out ends.
 */
export function useSwipeToDismiss(
    scrollRef: React.RefObject<HTMLDivElement | null>,
    open: boolean,
    onDismiss: () => void,
): {
    dragY: number;
    dragging: boolean;
    closing: boolean;
    handleProps: PointerHandlers;
    bodyProps: PointerHandlers;
    onTransitionEnd: (e: React.TransitionEvent<HTMLDivElement>) => void;
} {
    const dragStartY = React.useRef<number | undefined>(undefined);
    const [dragY, setDragYState] = React.useState(0);
    const [dragging, setDragging] = React.useState(false);
    const [closing, setClosing] = React.useState(false);

    // Mirror the live offset in a ref so `end` reads the value from the final pointermove, not the
    // (possibly stale) one captured in the render that created the handler.
    const dragYRef = React.useRef(0);
    const setDragY = React.useCallback((y: number) => {
        dragYRef.current = y;
        setDragYState(y);
    }, []);

    // Reset once the sheet has fully closed, so the next open starts from a clean, on-screen state.
    React.useEffect(() => {
        if (!open) {
            setDragY(0);
            setDragging(false);
            setClosing(false);
            dragStartY.current = undefined;
        }
    }, [open, setDragY]);

    // Abandon a gesture whose pointerup we never saw (released off-element / interrupted): snap back to
    // the open position and clear the armed start point so a later move can't drag from a stale origin.
    const cancel = (e: React.PointerEvent<HTMLDivElement>) => {
        dragStartY.current = undefined;
        setDragging(false);
        setDragY(0);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    };

    const end = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragStartY.current === undefined) return;
        const dismiss = dragYRef.current > DISMISS_THRESHOLD;
        dragStartY.current = undefined;
        setDragging(false);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
        if (dismiss) {
            // Continue the swipe: slide the sheet the rest of the way down from where the finger let
            // go (both grab zones are direct children of the sheet, so parentElement is the surface).
            // The actual dismiss fires from onTransitionEnd once this slide finishes.
            const distance = e.currentTarget.parentElement?.offsetHeight || window.innerHeight;
            setClosing(true);
            setDragY(distance);
        } else {
            // Not far enough — snap back up to the open position.
            setDragY(0);
        }
    };

    const onTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
        if (!closing || e.propertyName !== 'transform') return;
        onDismiss();
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
            if (e.buttons === 0) return cancel(e);
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
            if (e.buttons === 0) return cancel(e);
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

    return { bodyProps, closing, dragY, dragging, handleProps, onTransitionEnd };
}
