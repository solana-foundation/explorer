import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import AddressLookupTableEntriesPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Entries of the address lookup table at ${address} on Solana`,
        title: `Address Lookup Table Entries | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function AddressLookupTableEntriesPage(props: Props) {
    const params = await props.params;
    return <AddressLookupTableEntriesPageClient params={params} />;
}
