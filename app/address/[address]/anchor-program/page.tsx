import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { redirect } from 'next/navigation';
import { Metadata } from 'next/types';

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return {
        description: `The Interface Definition Language (IDL) file for the Anchor program at address ${address} on Solana`,
        title: `Anchor Program IDL | ${await getReadableTitleFromAddress(props)} | Solana`,
    };
}
/**
 * @deprecated This route is deprecated. Programs may have multiple IDLs.
 * The Anchor program IDL page has been renamed to a more generic one.
 */
export default async function DeprecatedAnchorProgramIDLPage(props: Props) {
    const { address } = await props.params;

    return redirect(`/address/${address}/idl`);
}
