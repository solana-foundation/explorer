import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';

import { withTraceData } from '@/app/shared/lib/sentry';

import AccountDataPageClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    const { address } = await props.params;
    return withTraceData({
        description: `Decoded Program account data for the account with address ${address} on Solana`,
        title: `Account Data | ${await getReadableTitleFromAddress(props)} | Solana`,
    });
}

type Props = Readonly<{
    params: Promise<{
        address: string;
    }>;
}>;

// Page for decoded Program account data. (can contain Anchor, Codama or custom accounts decodings)
// Currently is used only for PMP accounts.
export default async function AccountDataPage(props: Props) {
    const params = await props.params;
    return <AccountDataPageClient params={params} />;
}
