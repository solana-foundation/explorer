'use client';

import { TransactionInspectorPage } from '@components/inspector/InspectorPage';

import { SentryErrorBoundary } from '@/app/shared/lib/sentry';

export default function Page() {
    return (
        <SentryErrorBoundary fallbackMessage="Failed to load inspector">
            <TransactionInspectorPage showTokenBalanceChanges={true} />
        </SentryErrorBoundary>
    );
}
