import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import VoteHistoryPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Vote history of the address ${address} by slot on Solana`,
        title: `Vote History | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function VoteHistoryPage(props: Props) {
    const params = await props.params;
    return <VoteHistoryPageClient params={params} />;
}
