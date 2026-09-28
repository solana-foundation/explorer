'use client';

import { RefObject, useEffect, useRef, useState } from 'react';

const DEFAULT_MID_TRUNCATE_CHARS = 5;

// Space reserved for Copyable's copy icon (13px SVG + ~11px margin)
const COPY_ICON_RESERVED_PX = 24;

type UseMidTruncationOptions = {
    midTruncateChars?: number;
    trailingRef?: RefObject<HTMLElement | null>;
};

/**
 * Measures whether `text` overflows its container and, if so, signals mid-truncation
 * (e.g. "So111...11112"). Pass `trailingRef` for any sibling element whose width + margin-left
 * should be subtracted from the available space (e.g. an edit button).
 * `midTruncateChars` controls how many leading/trailing characters survive truncation, defaulting to 5.
 */
export function useMidTruncation(
    enabled: boolean,
    text: string,
    { midTruncateChars = DEFAULT_MID_TRUNCATE_CHARS, trailingRef }: UseMidTruncationOptions = {},
) {
    const rowRef = useRef<HTMLDivElement>(null);
    const hiddenTextRef = useRef<HTMLSpanElement>(null);
    const [isMidTruncated, setIsMidTruncated] = useState(false);

    useEffect(() => {
        if (!enabled) {
            setIsMidTruncated(false);
            return;
        }

        const check = () => {
            const row = rowRef.current;
            const hidden = hiddenTextRef.current;
            if (!row || !hidden) return;
            let trailingSpace = 0;
            const trailing = trailingRef?.current;
            if (trailing) {
                const style = getComputedStyle(trailing);
                trailingSpace = trailing.getBoundingClientRect().width + parseFloat(style.marginInlineStart || '0');
            }
            setIsMidTruncated(
                hidden.getBoundingClientRect().width > row.clientWidth - COPY_ICON_RESERVED_PX - trailingSpace,
            );
        };

        const observer = new ResizeObserver(check);
        if (rowRef.current) observer.observe(rowRef.current);
        check();

        return () => observer.disconnect();
    }, [enabled, text, trailingRef]);

    return {
        hiddenTextRef,
        isMidTruncated,
        midTruncatedText: `${text.slice(0, midTruncateChars)}…${text.slice(-midTruncateChars)}`,
        rowRef,
    };
}
