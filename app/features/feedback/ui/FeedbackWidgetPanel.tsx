'use client';

import { useEffect, useRef, useState } from 'react';

import { BUG_REPORT_ISSUES_URL, FEEDBACK_ISSUES_URL, isFeedbackEnabled } from '../env';
import { openFeedbackPopup, takeFeedbackRequest, useFeedbackRequest } from '../model/feedback';
import { useFeedbackForm } from '../model/use-feedback-form';
import { BaseFeedbackWidget } from './BaseFeedbackWidget';
import { FeedbackPopup } from './FeedbackPopup';

export function FeedbackWidgetPanel() {
    const { isSubmitting, submit } = useFeedbackForm();
    const triggerRef = useRef<HTMLButtonElement>(null);
    const originRef = useRef<HTMLElement | null>(null);
    const [open, setOpen] = useState(false);
    const request = useFeedbackRequest();

    useEffect(() => {
        if (!request) return;
        takeFeedbackRequest();
        originRef.current = request.origin;
        setOpen(true);
    }, [request]);

    return (
        <>
            <div className="sticky bottom-0 z-40 hidden h-0 lg:block">
                <div className="absolute bottom-4 right-4 flex">
                    <BaseFeedbackWidget
                        ref={triggerRef}
                        aria-expanded={open}
                        aria-haspopup="dialog"
                        onClick={() => openFeedbackPopup(triggerRef.current)}
                        style={{ opacity: open && originRef.current === triggerRef.current ? 0 : 1 }}
                    />
                </div>
            </div>
            <FeedbackPopup
                bugReportUrl={BUG_REPORT_ISSUES_URL}
                ideasUrl={FEEDBACK_ISSUES_URL}
                isSubmitting={isSubmitting}
                onOpenChange={setOpen}
                onSubmitFeedback={isFeedbackEnabled() ? submit : undefined}
                open={open}
                originRef={originRef}
            />
        </>
    );
}
