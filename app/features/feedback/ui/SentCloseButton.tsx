'use client';

import { type RefObject } from 'react';

import { SENT_RING, SENT_RING_LENGTH } from './feedback-sent-motion';

export function SentCloseButton({
    buttonRef,
    ringRef,
    onClose,
}: {
    buttonRef?: RefObject<HTMLButtonElement | null>;
    ringRef: RefObject<SVGRectElement | null>;
    onClose: () => void;
}) {
    return (
        <button
            ref={buttonRef}
            type="button"
            className="relative flex cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 text-sm font-medium text-dark-background/40 hover:text-dark-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dark-background"
            style={{ height: SENT_RING.height + 2, width: SENT_RING.width + 2 }}
            onClick={onClose}
        >
            Close
            <svg
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 overflow-visible"
                height={SENT_RING.height + 2}
                width={SENT_RING.width + 2}
            >
                <rect
                    ref={ringRef}
                    className="text-dark-background/40"
                    fill="none"
                    height={SENT_RING.height}
                    rx={SENT_RING.radius}
                    stroke="currentColor"
                    strokeDasharray={SENT_RING_LENGTH}
                    strokeLinecap="round"
                    strokeWidth={1.5}
                    width={SENT_RING.width}
                    x={1}
                    y={1}
                />
            </svg>
        </button>
    );
}
