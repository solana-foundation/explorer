'use client';

import { TransactionInspectorPage } from '@components/inspector/InspectorPage';

import { SentryErrorBoundary } from '@/app/components/common/SentryErrorBoundary';

type Props = Readonly<{
    params: Readonly<{
        signature: string;
    }>;
}>;

export default function Page({ params: { signature } }: Props) {
    return (
        <SentryErrorBoundary fallbackMessage="Failed to load inspector">
            <TransactionInspectorPage signature={signature} showTokenBalanceChanges={true} />
        </SentryErrorBoundary>
    );
}
