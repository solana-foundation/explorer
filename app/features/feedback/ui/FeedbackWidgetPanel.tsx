'use client';

import { BUG_REPORT_ISSUES_URL, FEEDBACK_ISSUES_URL, isFeedbackEnabled } from '../env';
import { useFeedbackForm } from '../model/use-feedback-form';
import { BaseFeedbackForm } from './BaseFeedbackForm';
import { BaseFeedbackWidget } from './BaseFeedbackWidget';

export function FeedbackWidgetPanel() {
    const { isOpen, isSubmitting, setIsOpen, submit } = useFeedbackForm();

    return (
        <>
            <BaseFeedbackWidget
                bugReportUrl={BUG_REPORT_ISSUES_URL}
                ideasUrl={FEEDBACK_ISSUES_URL}
                onShareFeedback={() => setIsOpen(true)}
                showSentryActions={isFeedbackEnabled()}
            />
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
