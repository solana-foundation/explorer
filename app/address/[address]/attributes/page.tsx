import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import NFTAttributesPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Attributes of the Metaplex NFT with address ${address} on Solana`,
        title: `Metaplex NFT Attributes | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function MetaplexNFTAttributesPage(props: Props) {
    const params = await props.params;
    return <NFTAttributesPageClient params={params} />;
}
