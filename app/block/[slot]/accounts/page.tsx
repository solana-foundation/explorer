import { Metadata } from 'next/types';

import BlockAccountsTabClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        slot: string;
    }>;
}>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { slot } = await props.params;

    return {
        description: `Statistics pertaining to accounts which were accessed or written to during block ${slot} on Solana`,
        title: `Accounts Active In Block | ${slot} | Solana`,
    };
}

export default async function BlockAccountsTab(props: Props) {
    const params = await props.params;
    return <BlockAccountsTabClient params={params} />;
}
