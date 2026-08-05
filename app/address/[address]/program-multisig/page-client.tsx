'use client';

import { ParsedAccountRenderer } from '@components/account/ParsedAccountRenderer';
import { BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL, isParsedAccountProgram } from '@explorer/parsers';
import React from 'react';

import { ProgramMultisigCard } from '@/app/components/account/ProgramMultisigCard';

type Props = Readonly<{
    params: {
        address: string;
    };
}>;

function ProgramMultisigCardRenderer({
    account,
    onNotFound,
}: React.ComponentProps<React.ComponentProps<typeof ParsedAccountRenderer>['renderComponent']>) {
    const parsedData = account?.data?.parsed;
    if (!isParsedAccountProgram(parsedData, BPF_UPGRADEABLE_LOADER_PROGRAM_LABEL)) {
        return onNotFound();
    }
    return <ProgramMultisigCard data={parsedData} />;
}

export default function ProgramMultisigPageClient({ params: { address } }: Props) {
    return <ParsedAccountRenderer address={address} renderComponent={ProgramMultisigCardRenderer} />;
}
