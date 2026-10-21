'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { isFeedbackWidgetEnabled } from '../env';
import { openFeedbackPopup } from '../model/feedback';

export interface FeedbackTriggerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> {
    children: ReactNode;
}

export function FeedbackTrigger({ children, ...props }: FeedbackTriggerProps) {
    if (!isFeedbackWidgetEnabled()) return undefined;

    return (
        <button {...props} onClick={event => openFeedbackPopup(event.currentTarget)} type="button">
            {children}
        </button>
    );
}
