'use client';

import { BUG_REPORT_ISSUES_URL, FEEDBACK_ISSUES_URL, isFeedbackEnabled } from '../env';
import { useFeedbackOpen } from '../model/feedback';
import { useFeedbackForm } from '../model/use-feedback-form';
import { BaseFeedbackWidget } from './BaseFeedbackWidget';
import { FeedbackPopup } from './FeedbackPopup';

export function FeedbackWidgetPanel() {
    const { isSubmitting, submit } = useFeedbackForm();
    const [open, setOpen] = useFeedbackOpen();

    return (
        <>
            <div className="sticky bottom-0 z-40 hidden h-0 lg:block">
                <div className="absolute bottom-4 right-4 flex">
                    <BaseFeedbackWidget aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(true)} />
                </div>
            </div>
            <FeedbackPopup
                bugReportUrl={BUG_REPORT_ISSUES_URL}
                ideasUrl={FEEDBACK_ISSUES_URL}
                isSubmitting={isSubmitting}
                onOpenChange={setOpen}
                onSubmitFeedback={isFeedbackEnabled() ? submit : undefined}
                open={open}
            />
        </>
    );
}
