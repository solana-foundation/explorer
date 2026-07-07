import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import SubscriptionPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Subscription account data for address ${address} on Solana`,
        title: `Subscription | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function SubscriptionPage(props: Props) {
    const params = await props.params;
    return <SubscriptionPageClient params={params} />;
}
