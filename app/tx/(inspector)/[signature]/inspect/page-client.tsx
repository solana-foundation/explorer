'use client';

import { TransactionInspectorPage } from '@components/inspector/InspectorPage';

import { SentryErrorBoundary } from '@/app/components/common/SentryErrorBoundary';

export default function InspectPageClient({ signature }: Readonly<{ signature: string }>) {
    return (
        <SentryErrorBoundary fallbackMessage="Failed to load inspector">
            <TransactionInspectorPage signature={signature} showTokenBalanceChanges={false} />
        </SentryErrorBoundary>
    );
}
