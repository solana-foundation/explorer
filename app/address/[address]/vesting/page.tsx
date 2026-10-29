import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import { withTraceData } from '@/app/shared/lib/sentry';

import VestingPageClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return withTraceData({
        description: `Genesis vesting locks, unlock schedule and circulating supply of the token ${address} on Solana`,
        title: `Vesting | ${await getReadableTitleFromAddress(props)} | Solana`,
    });
}

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export default async function VestingPage(props: Props) {
    const params = await props.params;
    return <VestingPageClient params={params} />;
}
