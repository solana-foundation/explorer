'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Logger } from '@/app/shared/lib/logger';

type Props = Readonly<{
    children: ReactNode;
    fallbackMessage?: string;
}>;

export function SentryErrorBoundary({ children, fallbackMessage = 'Failed to load' }: Props) {
    return (
        <ErrorBoundary
            onError={(error: Error) => {
                Logger.panic(error);
            }}
            fallbackRender={({ error }) => <ErrorCard text={`${fallbackMessage}: ${error.message}`} />}
        >
            {children}
        </ErrorBoundary>
    );
}
