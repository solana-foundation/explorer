import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import ConcurrentMerkleTreePageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Contents of the SPL Concurrent Merkle Tree at address ${address} on Solana`,
        title: `Concurrent Merkle Tree | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function ConcurrentMerkleTreePage(props: Props) {
    const params = await props.params;
    return <ConcurrentMerkleTreePageClient params={params} />;
}
