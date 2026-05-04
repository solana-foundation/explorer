import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import { withTraceData } from '@/app/shared/lib/sentry';

import SecurityPageClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return withTraceData({
        description: `Contents of the security.txt for the program with address ${address} on Solana`,
        title: `Security | ${await getReadableTitleFromAddress(props)} | Solana`,
    });
}

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export default async function SecurityPage(props: Props) {
    const params = await props.params;
    return <SecurityPageClient params={params} />;
}
