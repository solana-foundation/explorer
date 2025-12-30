'use client';

import { captureException } from '@sentry/nextjs';
import { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ErrorCard } from './ErrorCard';

const isSentryEnabled = process.env.NEXT_PUBLIC_ENABLE_CATCH_EXCEPTIONS === '1';

type Props = Readonly<{
    children: ReactNode;
    fallbackMessage?: string;
}>;

export function SentryErrorBoundary({ children, fallbackMessage = 'Failed to load' }: Props) {
    return (
        <ErrorBoundary
            onError={(error: Error) => {
                if (isSentryEnabled) {
                    captureException(error);
                }
            }}
            fallbackRender={({ error }) => <ErrorCard text={`${fallbackMessage}: ${error.message}`} />}
        >
            {children}
        </ErrorBoundary>
    );
}
