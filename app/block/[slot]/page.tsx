import { Metadata } from 'next/types';

import BlockTransactionsTabClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        slot: string;
    }>;
}>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { slot } = await props.params;

    return {
        description: `History of all transactions during block ${slot} on Solana`,
        title: `Block | ${slot} | Solana`,
    };
}

export default async function BlockTransactionsTab(props: Props) {
    const params = await props.params;
    return <BlockTransactionsTabClient params={params} />;
}
