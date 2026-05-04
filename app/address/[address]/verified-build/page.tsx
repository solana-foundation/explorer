import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import VerifiedBuildClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Contents of the verified build info for the program with address ${address} on Solana`,
        title: `Verified Build | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export default async function VerifiedBuildPage(props: Props) {
    const params = await props.params;
    return <VerifiedBuildClient params={params} />;
}
