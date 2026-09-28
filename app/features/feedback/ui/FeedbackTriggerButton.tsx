'use client';

import type { ReactNode } from 'react';

import { BUG_REPORT_ISSUES_URL, FEEDBACK_ISSUES_URL } from '../env';
import { useFeedbackForm } from '../model/use-feedback-form';
import { BaseFeedbackForm } from './BaseFeedbackForm';

export interface FeedbackTriggerButtonProps {
    children: ReactNode;
    className?: string;
}

export function FeedbackTriggerButton({ children, className }: FeedbackTriggerButtonProps) {
    const { isOpen, isSubmitting, setIsOpen, submit } = useFeedbackForm();

    return (
        <>
            <button className={className} onClick={() => setIsOpen(true)} type="button">
                {children}
            </button>
            <BaseFeedbackForm
                bugReportUrl={BUG_REPORT_ISSUES_URL}
                ideasUrl={FEEDBACK_ISSUES_URL}
                isSubmitting={isSubmitting}
                onOpenChange={setIsOpen}
                onSubmit={submit}
                open={isOpen}
            />
        </>
    );
}
