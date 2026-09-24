'use client';

import dynamic from 'next/dynamic';

import { isFeedbackWidgetEnabled } from '../env';

export function FeedbackWidget() {
    if (!isFeedbackWidgetEnabled()) return undefined;

    return <FeedbackWidgetPanel />;
}

// A static import bundles the feedback form and `sendFeedback` even when the flag is off.
const FeedbackWidgetPanel = dynamic(() => import('./FeedbackWidgetPanel').then(m => m.FeedbackWidgetPanel), {
    ssr: false,
});
