'use client';

import { BlockhashesCard } from '@components/account/BlockhashesCard';
import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import { isParsedAccountProgram, SYSVAR_PROGRAM_LABEL } from '@explorer/parsers';
import React from 'react';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function BlockhashesCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    const parsedData = account?.data?.parsed;
    if (!isParsedAccountProgram(parsedData, SYSVAR_PROGRAM_LABEL) || parsedData.parsed.type !== 'recentBlockhashes') {
        return onNotFound();
    }
    return <BlockhashesCard blockhashes={parsedData.parsed.info} />;
}

export default function RecentBlockhashesPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={BlockhashesCardRenderer} />;
}
