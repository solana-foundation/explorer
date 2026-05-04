import { Metadata } from 'next/types';

import BlockRewardsTabClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        slot: string;
    }>;
}>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { slot } = await props.params;

    return {
        description: `List of addresses to which rewards were disbursed during block ${slot} on Solana`,
        title: `Block Rewards | ${slot} | Solana`,
    };
}

export default async function BlockRewardsTab(props: Props) {
    const params = await props.params;
    return <BlockRewardsTabClient params={params} />;
}
