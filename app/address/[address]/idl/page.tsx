import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import { withTraceData } from '@/app/shared/lib/sentry';

import IdlPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return withTraceData({
        description: `The Interface Definition Language (IDL) file for the program at address ${address} on Solana`,
        title: `Program IDL | ${await getReadableTitleFromAddress(props)} | Solana`,
    });
}

export default async function ProgramIDLPage(props: Props) {
    const params = await props.params;
    return <IdlPageClient address={params.address} />;
}
