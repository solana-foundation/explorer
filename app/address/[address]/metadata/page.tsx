import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import MetaplexNFTMetadataPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Metadata for address ${address} on Solana`,
        title: `Metadata | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function MetaplexNFTMetadataPage(props: Props) {
    const params = await props.params;
    return <MetaplexNFTMetadataPageClient params={params} />;
}
