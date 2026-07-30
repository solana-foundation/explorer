'use client';

import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import { isParsedAccountProgram, SYSVAR_PROGRAM_LABEL } from '@explorer/parsers';
import { StakeHistoryCard } from '@features/stake';
import React from 'react';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function StakeHistoryCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    const parsedData = account?.data?.parsed;
    if (!isParsedAccountProgram(parsedData, SYSVAR_PROGRAM_LABEL) || parsedData.parsed.type !== 'stakeHistory') {
        return onNotFound();
    }
    return <StakeHistoryCard sysvarAccount={parsedData.parsed} />;
}

export default function StakeHistoryPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={StakeHistoryCardRenderer} />;
}
