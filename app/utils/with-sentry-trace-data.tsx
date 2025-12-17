import * as Sentry from '@sentry/nextjs';
import { Metadata } from 'next/types';

/**
 *
 * @param metadata
 * @param metadata.others Allow to specify additional arguments. Overwrites default ones
 * @returns
 */
export function withSentryTraceData(
    metadata: Metadata & {
        others?: ReturnType<typeof Sentry.getTraceData>;
    }
) {
    return {
        ...metadata,
        others: {
            // Include the Sentry trace data:
            ...Sentry.getTraceData(),
            ...(metadata.others ?? {}),
        },
    };
}
