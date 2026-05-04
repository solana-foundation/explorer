import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import ProgramMultisigPageClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `Multisig information for the upgrade authority of the program with address ${address} on Solana`,
        title: `Upgrade Authority Multisig | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export default async function ProgramMultisigPage(props: Props) {
    const params = await props.params;
    return <ProgramMultisigPageClient params={params} />;
}
