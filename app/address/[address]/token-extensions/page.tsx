import './styles.css';

import { TokenExtensionsCard } from '@components/account/TokenExtensionsCard';
import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return {
        description: `Token extensions information for address ${props.params.address} on Solana`,
        title: `Token Extensions | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}

export default function TokenExtensionsPage({ params: { address: _address } }: Props) {
    return <TokenExtensionsCard address={_address} />;
}
