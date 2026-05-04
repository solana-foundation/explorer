import { TokenTransfersCard } from '@components/account/history/TokenTransfersCard';
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
        description: `History of all token transfers involving the address ${address} on Solana`,
        title: `Transfers | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function TokenTransfersPage(props: Props) {
    const { address } = await props.params;

    return <TokenTransfersCard address={address} />;
}
