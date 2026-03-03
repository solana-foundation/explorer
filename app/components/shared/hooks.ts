'use client';

import { useCallback, useRef, useState } from 'react';

const DEFAULT_CLOSE_DELAY = 100;

export function useHoverPopover(closeDelay = DEFAULT_CLOSE_DELAY) {
    const [isOpen, setIsOpen] = useState(false);
    const timeoutRef = useRef<NodeJS.Timeout>();

    const open = useCallback(() => {
        clearTimeout(timeoutRef.current);
        setIsOpen(true);
    }, []);

    const close = useCallback(() => {
        timeoutRef.current = setTimeout(() => setIsOpen(false), closeDelay);
    }, [closeDelay]);

    const hoverHandlers = {
        onMouseEnter: open,
        onMouseLeave: close,
    };

    return { hoverHandlers, isOpen, setIsOpen };
}
