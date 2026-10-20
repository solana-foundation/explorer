'use client';

import { useSetAtom } from 'jotai';
import type { ReactNode } from 'react';

import { isFeedbackWidgetEnabled } from '../env';
import { feedbackOpenAtom } from '../model/feedback';

export interface FeedbackTriggerProps {
    children: ReactNode;
    className?: string;
}

export function FeedbackTrigger({ children, className }: FeedbackTriggerProps) {
    const setOpen = useSetAtom(feedbackOpenAtom);
    if (!isFeedbackWidgetEnabled()) return undefined;

    return (
        <button className={className} onClick={() => setOpen(true)} type="button">
            {children}
        </button>
    );
}
