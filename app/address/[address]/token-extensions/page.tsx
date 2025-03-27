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

export default async function TokenExtensionsPage({ params: { address: _address } }: Props) {
    // TODO: Implement token extensions content
    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-header-title">Token Extensions</h3>
            </div>
            <div className="card-body">{/* Content will be implemented later */}</div>
        </div>
    );
}
