import { Metadata } from 'next/types';

import BlockTransactionsTabClient from './page-client';

type Props = Readonly<{
    params: {
        slot: string;
    };
}>;

export async function generateMetadata({ params: { slot } }: Props): Promise<Metadata> {
    return {
        description: `History of all transactions during block ${slot} on Fogo`,
        title: `Block | ${slot} | Fogo`,
    };
}

export default function BlockTransactionsTab(props: Props) {
    return <BlockTransactionsTabClient {...props} />;
}
