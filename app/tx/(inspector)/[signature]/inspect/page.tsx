import { Metadata } from 'next/types';

import { withSentryTraceData } from '@/app/utils/with-sentry-trace-data';

import InspectPageClient from './page-client';

type Props = Readonly<{
    params: Readonly<{
        signature: string;
    }>;
}>;

export async function generateMetadata({ params: { signature } }: Props): Promise<Metadata> {
    return withSentryTraceData({
        description: `Interactively inspect the transaction with signature ${signature} on Solana`,
        title: `Transaction Inspector | ${signature} | Solana`,
    });
}

export default function TransactionInspectionPage({ params: { signature } }: Props) {
    return <InspectPageClient signature={signature} />;
}
