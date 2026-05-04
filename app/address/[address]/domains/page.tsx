import { DomainsCard } from '@entities/domain';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Domain names owned by the address ${address} on Solana`,
        title: `Domains | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function OwnedDomainsPage(props: Props) {
    const { address } = await props.params;

    return <DomainsCard address={address} />;
}
