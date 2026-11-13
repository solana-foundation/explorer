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
    // `pb-14` plus the root layout's `pb-6` leaves ~80px above the footer, matching the redesigned pages.
    return (
        <div className="pb-14">
            <SlotHashesCard sysvarAccount={parsedData.parsed} />
        </div>
    );
}

export default function SlotHashesPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={SlotHashesCardRenderer} />;
}
