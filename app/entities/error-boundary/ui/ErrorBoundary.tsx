'use client';

import { captureException } from '@sentry/nextjs';
import { ComponentType, ErrorInfo } from 'react';
import { ErrorBoundary, ErrorBoundaryProps } from 'react-error-boundary';

const isSentryEnabled = process.env.NEXT_PUBLIC_ENABLE_CATCH_EXCEPTIONS === '1';

/**
 * HOC that wraps a component with boundary that will intercept and send errors to Sentry
 */
export function withSentry<P extends object>(WrappedComponent: ComponentType<P>, boundaryOptions: ErrorBoundaryProps) {
    const { onError, ...boundaryProps } = boundaryOptions;

    const onErrorHandler = (error: Error, errorInfo: ErrorInfo) => {
        onError?.(error, errorInfo);
        if (isSentryEnabled) {
            captureException(error);
        }
    };

    return function WithSentry(props: P) {
        return (
            <ErrorBoundary onError={onErrorHandler} {...boundaryProps}>
                <WrappedComponent {...props} />
            </ErrorBoundary>
        );
    };
}
