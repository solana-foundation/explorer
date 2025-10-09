import getReadableTitleFromAddress, { AddressPageMetadataProps } from '@utils/get-readable-title-from-address';
import { Metadata } from 'next/types';
import { ComponentProps } from 'react';

import { withSentryTraceData } from '@/app/utils/with-sentry-trace-data';

import ProgramCpiCallsClient from './page-client';

export async function generateMetadata(props: AddressPageMetadataProps): Promise<Metadata> {
    return withSentryTraceData({
        description: `CPI call for the program ${props.params.address} on Solana`,
        title: `Program CPI Calls | ${await getReadableTitleFromAddress(props)} | Solana`,
    });
}

export default function ProgramCPICallsPage(props: ComponentProps<typeof ProgramCpiCallsClient>) {
    return <ProgramCpiCallsClient {...props} />;
}
