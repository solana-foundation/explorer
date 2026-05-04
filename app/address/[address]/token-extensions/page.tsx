import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import TokenExtensionsEntriesPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Token extensions information for address ${address} on Solana`,
        title: `Token Extensions | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function TokenExtensionsPage(props: Props) {
    const params = await props.params;
    return <TokenExtensionsEntriesPageClient params={params} />;
}
