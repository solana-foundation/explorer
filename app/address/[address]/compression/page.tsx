import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import CompressionPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Information about the Compressed NFT with address ${address} on Solana`,
        title: `Compression Information | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function CompressionPage(props: Props) {
    const params = await props.params;
    return <CompressionPageClient params={params} />;
}
