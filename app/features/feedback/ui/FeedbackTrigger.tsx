'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { isFeedbackEnabled, isFeedbackWidgetEnabled } from '../env';

// The flag is read at runtime, so only a dynamic import keeps the form and the Sentry client out of a build that has it off
const FeedbackTriggerButton = dynamic(() => import('./FeedbackTriggerButton').then(m => m.FeedbackTriggerButton), {
    ssr: false,
});

export interface FeedbackTriggerProps {
    children: ReactNode;
    className?: string;
}

/** Inline trigger (e.g. a footer link) that opens the feedback form; renders nothing without a client DSN. */
export function FeedbackTrigger({ children, className }: FeedbackTriggerProps) {
    if (!isFeedbackWidgetEnabled() || !isFeedbackEnabled()) return undefined;

    return <FeedbackTriggerButton className={className}>{children}</FeedbackTriggerButton>;
}
