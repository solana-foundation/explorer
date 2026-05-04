import { Metadata } from 'next/types';

import EpochDetailsPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        epoch: string;
    }>;
}>;

export async function generateMetadata(props: Props): Promise<Metadata> {
    const { epoch } = await props.params;

    return {
        description: `Summary of ${epoch} on Solana`,
        title: `Epoch | ${epoch} | Solana`,
    };
}

export default async function EpochDetailsPage(props: Props) {
    const params = await props.params;
    return <EpochDetailsPageClient params={params} />;
}
