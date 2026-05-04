import { TokenInstructionsCard } from '@components/account/history/TokenInstructionsCard';
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
        description: `A list of transactions that include an instruction involving the token with address ${address} on Solana`,
        title: `Token Instructions | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function TokenInstructionsPage(props: Props) {
    const { address } = await props.params;

    return <TokenInstructionsCard address={address} />;
}
