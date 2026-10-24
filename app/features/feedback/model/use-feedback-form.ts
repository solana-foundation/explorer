import { clusterSlug, useCluster } from '@entities/cluster';
import { useState } from 'react';

import { Logger } from '@/app/shared/lib/logger';
import { withScope } from '@/app/shared/lib/sentry';
import { sendFeedback } from '@/app/shared/lib/sentry/client';

const FEEDBACK_SOURCE = 'widget';

export const FEEDBACK_SEND_ERROR = { description: 'Try again.', title: 'Could not send feedback' };
export const FEEDBACK_SENT = { description: 'Thank you fren, enjoy exploring', title: 'Feedback sent!' };

export interface FeedbackFormValues {
    contact?: string;
    message: string;
    rating?: number;
}

export function useFeedbackForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { cluster } = useCluster();

    const submit = async (values: FeedbackFormValues): Promise<boolean> => {
        setIsSubmitting(true);
        try {
            await withScope(() =>
                sendFeedback({
                    message: values.message,
                    name: values.contact,
                    source: FEEDBACK_SOURCE,
                    tags: {
                        cluster: clusterSlug(cluster),
                        rating: values.rating,
                        source: FEEDBACK_SOURCE,
                        type: 'feedback',
                    },
                }),
            );
            return true;
        } catch (error) {
            Logger.error(error, { sentry: 'always', sentryExtras: { source: FEEDBACK_SOURCE } });
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    return { isSubmitting, submit };
}
