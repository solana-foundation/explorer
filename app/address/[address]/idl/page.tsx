import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';
import { ComponentProps } from 'react';

import { withSentryTraceData } from '@/app/utils/with-sentry-trace-data';

import IdlPageClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return withSentryTraceData({
        description: `The Interface Definition Language (IDL) file for the program at address ${props.params.address} on Solana`,
        title: `Program IDL | ${await getReadableTitleFromAddress(props)} | Solana`,
    });
}

export default function ProgramIDLPage(props: ComponentProps<typeof IdlPageClient>) {
    return <IdlPageClient {...props} />;
}
