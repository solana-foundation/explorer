'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

import { isFeedbackEnabled, isFeedbackWidgetEnabled } from '../env';

// A static import bundles the feedback form and `sendFeedback` even when the flag is off.
const FeedbackTriggerButton = dynamic(() => import('./FeedbackTriggerButton').then(m => m.FeedbackTriggerButton), {
    ssr: false,
});

export interface FeedbackTriggerProps {
    children: ReactNode;
    className?: string;
}

/** Opens the feedback form from inline content, such as a footer link. */
export function FeedbackTrigger({ children, className }: FeedbackTriggerProps) {
    if (!isFeedbackWidgetEnabled() || !isFeedbackEnabled()) return undefined;

    return <FeedbackTriggerButton className={className}>{children}</FeedbackTriggerButton>;
}
