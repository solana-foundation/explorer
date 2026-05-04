import { RewardsCard } from '@components/account/RewardsCard';
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
        description: `Rewards due to the address ${address} by epoch on Solana`,
        title: `Address Rewards | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function BlockRewardsPage(props: Props) {
    const { address } = await props.params;

    return <RewardsCard address={address} />;
}
