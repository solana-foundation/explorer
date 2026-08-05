'use client';

import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import { SlotHashesCard } from '@components/account/SlotHashesCard';
import { isParsedAccountProgram, SYSVAR_PROGRAM_LABEL } from '@explorer/parsers';
import React from 'react';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function SlotHashesCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    const parsedData = account?.data?.parsed;
    if (!isParsedAccountProgram(parsedData, SYSVAR_PROGRAM_LABEL) || parsedData.parsed.type !== 'slotHashes') {
        return onNotFound();
    }
    return <SlotHashesCard sysvarAccount={parsedData.parsed} />;
}

export default function SlotHashesPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={SlotHashesCardRenderer} />;
}
