import { clusterSlug, useCluster } from '@entities/cluster';
import { useState } from 'react';

import { useToast } from '@/app/components/shared/ui/sonner/use-toast';
import { withScope } from '@/app/shared/lib/sentry';
import { sendFeedback } from '@/app/shared/lib/sentry/client';

import type { FeedbackFormValues } from '../ui/BaseFeedbackForm';

const FEEDBACK_SOURCE = 'widget';

export function useFeedbackForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { cluster } = useCluster();
    const toast = useToast();

    const submit = async (values: FeedbackFormValues) => {
        setIsSubmitting(true);
        try {
            // sendFeedback sets its tags on the current scope. withScope keeps those tags off later events.
            await withScope(() =>
                sendFeedback({
                    message: values.message,
                    name: values.contact,
                    // sendFeedback sets `source` to 'api' when it is unset.
                    source: FEEDBACK_SOURCE,
                    tags: {
                        cluster: clusterSlug(cluster),
                        rating: values.rating,
                        source: FEEDBACK_SOURCE,
                        type: 'feedback',
                    },
                }),
            );
            setIsOpen(false);
            toast.custom({ description: 'Thank you fren, enjoy exploring', title: 'Feedback sent!', type: 'success' });
        } catch {
            // The form must stay open to keep the message the user typed.
            toast.custom({
                description: 'You can use the GitHub links in the form instead',
                title: 'Could not send feedback',
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return { isOpen, isSubmitting, setIsOpen, submit };
}
