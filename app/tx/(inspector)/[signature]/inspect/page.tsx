import { Metadata } from 'next/types';

import { withTraceData } from '@/app/shared/lib/sentry';

import InspectPageClient from './page-client';

type Props = Readonly<{
    params: Promise<
        Readonly<{
            signature: string;
        }>
    >;
}>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { signature } = await props.params;

    return withTraceData({
        description: `Interactively inspect the transaction with signature ${signature} on Solana`,
        title: `Transaction Inspector | ${signature} | Solana`,
    });
}

export default async function TransactionInspectionPage(props: Props) {
    const { signature } = await props.params;

    return <InspectPageClient signature={signature} />;
}
