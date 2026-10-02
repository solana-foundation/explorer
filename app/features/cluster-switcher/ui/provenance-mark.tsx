'use client';

import { AlertTriangle, CheckCircle } from 'react-feather';

export const KNOWN_COLOUR = '#1dd79b';
export const UNKNOWN_COLOUR = '#e08214';

const MARK_LABEL_CLASSES = 'text-[10px] font-medium uppercase tracking-[0.12em]';

export function KnownMark({ size = 12, title, withLabel }: { size?: number; title?: string; withLabel?: boolean }) {
    return (
        <span
            aria-hidden
            className="flex shrink-0 items-center gap-1"
            style={{ color: KNOWN_COLOUR }}
            title={title ?? 'A known endpoint — one this deployment ships with or vouches for'}
        >
            <CheckCircle size={size} />
            {withLabel && <span className={MARK_LABEL_CLASSES}>known</span>}
        </span>
    );
}

export function UnknownMark({ size = 12, title, withLabel }: { size?: number; title?: string; withLabel?: boolean }) {
    return (
        <span
            aria-hidden
            className="flex shrink-0 items-center gap-1"
            style={{ color: UNKNOWN_COLOUR }}
            title={title ?? 'Nobody has vouched for this endpoint'}
        >
            <AlertTriangle size={size} />
            {withLabel && <span className={MARK_LABEL_CLASSES}>unknown</span>}
        </span>
    );
}
