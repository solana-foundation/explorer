import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import MetaplexNFTMetadataPageClient from './page-client';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `Metadata for address ${props.params.address} on Solana`,
        title: `Metadata | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default function MetaplexNFTMetadataPage(props: Props) {
    return <MetaplexNFTMetadataPageClient {...props} />;
}
