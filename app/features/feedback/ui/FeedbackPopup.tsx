'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle } from 'react-feather';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/app/components/shared/ui/dialog';
import { cn } from '@/app/components/shared/utils';

import { FEEDBACK_SENT, type FeedbackFormValues } from '../model/use-feedback-form';
import { FeedbackTopics } from './FeedbackTopics';

export interface FeedbackPopupProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    bugReportUrl: string;
    ideasUrl: string;
    onSubmitFeedback?: (values: FeedbackFormValues) => Promise<boolean>;
    isSubmitting?: boolean;
}

const SENT_CLOSE_MS = 2500;

export function FeedbackPopup({
    open,
    onOpenChange,
    bugReportUrl,
    ideasUrl,
    onSubmitFeedback,
    isSubmitting = false,
}: FeedbackPopupProps) {
    const [sent, setSent] = useState(false);
    const [sendFailed, setSendFailed] = useState(false);
    const sessionRef = useRef(0);

    useEffect(() => {
        sessionRef.current += 1;
        setSent(false);
        setSendFailed(false);
    }, [open]);

    useEffect(() => {
        if (!sent) return;
        const timer = setTimeout(() => onOpenChange(false), SENT_CLOSE_MS);
        return () => clearTimeout(timer);
    }, [sent, onOpenChange]);

    const handleSubmit = (values: FeedbackFormValues) => {
        setSendFailed(false);
        const session = sessionRef.current;
        void onSubmitFeedback?.(values).then(delivered => {
            if (session !== sessionRef.current) return;
            if (delivered) setSent(true);
            else setSendFailed(true);
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    'max-h-[90dvh] !w-[calc(100%-2rem)] !max-w-md overflow-y-auto border-solid',
                    sent ? 'border-dark-accent bg-dark-accent' : 'border-outer-space-800 bg-outer-space-900',
                )}
            >
                {sent ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-center" role="status">
                        <CheckCircle aria-hidden="true" className="mb-1 text-dark-background" size={48} />
                        <DialogTitle className="text-2xl font-semibold text-dark-background">
                            {FEEDBACK_SENT.title}
                        </DialogTitle>
                        <DialogDescription className="text-base text-dark-background">
                            {FEEDBACK_SENT.description}
                        </DialogDescription>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col gap-1.5 pr-6">
                            <DialogTitle className="text-xl">Feedback</DialogTitle>
                            <DialogDescription className="text-outer-space-300">
                                What would you like to share?
                            </DialogDescription>
                        </div>
                        <FeedbackTopics
                            bugReportUrl={bugReportUrl}
                            error={sendFailed}
                            ideasUrl={ideasUrl}
                            isSubmitting={isSubmitting}
                            onNavigateAway={() => onOpenChange(false)}
                            onSubmit={handleSubmit}
                            showForm={Boolean(onSubmitFeedback)}
                        />
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
