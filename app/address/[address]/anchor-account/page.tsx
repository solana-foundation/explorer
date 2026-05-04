import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import AnchorAccountPageClient from './page-client';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Contents of the Anchor Account at address ${address} on Solana`,
        title: `Anchor Account Data | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default async function AnchorAccountPage(props: Props) {
    const params = await props.params;
    return <AnchorAccountPageClient params={params} />;
}
