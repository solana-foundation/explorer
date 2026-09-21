'use client';

import dynamic from 'next/dynamic';

import { isFeedbackWidgetEnabled } from '../env';

// The flag is read at runtime, so only a dynamic import keeps the form and the Sentry client out of a build that has it off
const FeedbackWidgetPanel = dynamic(() => import('./FeedbackWidgetPanel').then(m => m.FeedbackWidgetPanel), {
    ssr: false,
});

export function FeedbackWidget() {
    if (!isFeedbackWidgetEnabled()) return undefined;

    return <FeedbackWidgetPanel />;
}
