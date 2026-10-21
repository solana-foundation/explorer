'use client';

import { useSetAtom } from 'jotai';
import { type ButtonHTMLAttributes, forwardRef } from 'react';

import { isFeedbackWidgetEnabled } from '../env';
import { feedbackOpenAtom } from '../model/feedback';

export type FeedbackTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const FeedbackTrigger = forwardRef<HTMLButtonElement, FeedbackTriggerProps>(function FeedbackTrigger(
    { children, onClick, ...props },
    ref,
) {
    const setOpen = useSetAtom(feedbackOpenAtom);
    if (!isFeedbackWidgetEnabled()) return undefined;

    return (
        <button
            {...props}
            ref={ref}
            onClick={event => {
                onClick?.(event);
                setOpen(true);
            }}
            type="button"
        >
            {children}
        </button>
    );
});
