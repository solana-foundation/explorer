import { captureException, captureMessage, withScope } from '@sentry/nextjs';

import { Cluster, clusterSlug } from '@/app/utils/cluster';

/**
 * Severity levels for Sentry messages
 */
export enum SeverityLevel {
    Debug = 'debug',
    Info = 'info',
    Warning = 'warning',
    Error = 'error',
    Fatal = 'fatal',
}

/**
 * Context for API route errors
 */
interface ApiErrorContext {
    cluster?: number | string;
    programAddress?: string;
    endpoint?: string;
    queryParams?: Record<string, string | undefined>;
    additionalData?: Record<string, any>;
}

/**
 * Options for capturing messages
 */
interface CaptureMessageOptions {
    level?: SeverityLevel;
    fingerprint?: string[];
    tags?: Record<string, string>;
}

/**
 * Captures an exception and sends it to Sentry with API-specific context
 */
export const captureApiException = (error: unknown, context: ApiErrorContext): void => {
    // Add context to Sentry scope
    withScope(scope => {
        // Set tags for filtering
        if (context.cluster !== undefined) {
            const clusterName =
                Number(context.cluster) in Cluster ? clusterSlug(Number(context.cluster) as Cluster) : 'unknown';
            scope.setTag('cluster', clusterName);
        }

        if (context.endpoint) {
            scope.setTag('endpoint', context.endpoint);
        }

        // Set context data
        scope.setContext('api_request', {
            programAddress: context.programAddress,
            queryParams: context.queryParams,
            ...context.additionalData,
        });

        // Capture the exception
        captureException(error);
    });
};

/**
 * Captures a message to Sentry (useful for tracking specific events)
 */
export const captureApiMessage = (
    message: string,
    context: ApiErrorContext,
    options: CaptureMessageOptions = {}
): void => {
    const { level = SeverityLevel.Info, fingerprint, tags } = options;

    withScope(scope => {
        // Set tags
        if (context.cluster !== undefined) {
            const clusterName =
                Number(context.cluster) in Cluster ? clusterSlug(Number(context.cluster) as Cluster) : 'unknown';
            scope.setTag('cluster', clusterName);
        }

        if (context.endpoint) {
            scope.setTag('endpoint', context.endpoint);
        }

        // Add any additional tags
        if (tags) {
            Object.entries(tags).forEach(([key, value]) => {
                scope.setTag(key, value);
            });
        }

        // Set fingerprint if provided (for grouping similar issues)
        if (fingerprint) {
            scope.setFingerprint(fingerprint);
        }

        // Set context
        scope.setContext('api_event', {
            programAddress: context.programAddress,
            queryParams: context.queryParams,
            ...context.additionalData,
        });

        // Capture the message
        captureMessage(message, level as SeverityLevel);
    });
};
