import { NftokenCollectionGrid } from '@features/nftoken';
import { isAddress } from '@solana/kit';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { notFound } from 'next/navigation';
import { Metadata } from 'next/types';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `NFToken NFTs belonging to the collection ${address} on Solana`,
        title: `NFToken Collection NFTs | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function NFTokenCollectionPage(props: Props) {
    const { address } = await props.params;

    if (!isAddress(address)) notFound();

    return <NftokenCollectionGrid collection={address} />;
}
