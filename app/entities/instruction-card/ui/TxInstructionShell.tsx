import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { FetchStatus } from '@providers/cache';
import { useFetchRawTransaction, useRawTransactionDetails } from '@providers/transactions/raw';
import { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { useInstructionSurface } from '../model/surface';

type InstructionProps = {
    title: string;
    children?: React.ReactNode;
    result: SignatureResult;
    index: number;
    ix: TransactionInstruction | ParsedInstruction;
    defaultRaw?: boolean;
    childCards?: React.ReactNode;
    eventCards?: React.ReactNode[];
    childIndex?: number;
    raw?: TransactionInstruction;
    headerButtons?: React.ReactNode;
    collapsible?: boolean;
};

export function TxInstructionShell({
    title,
    children,
    result,
    index,
    ix,
    defaultRaw,
    childCards,
    eventCards,
    childIndex,
    raw: rawProp,
    headerButtons,
    collapsible,
}: InstructionProps) {
    const { signature } = useInstructionSurface();
    const rawDetails = useRawTransactionDetails(signature);

    // Use provided raw prop, or fetch from transaction details
    let raw: TransactionInstruction | undefined = rawProp;
    if (!raw && rawDetails && childIndex === undefined) {
        raw = rawDetails?.data?.raw?.transaction?.instructions[index];
    }

    const fetchRaw = useFetchRawTransaction();

    // Only allow fetching raw data if we have a valid signature, and only
    // while a fetch could still produce it: a v1 transaction has no web3.js instruction view, so
    // once its raw data has arrived, asking again would refetch on every open of the Raw view.
    const rawFetched = rawDetails?.status === FetchStatus.Fetched;
    const canFetchRaw = signature !== undefined && !raw && !rawFetched;
    // Inner instructions never carry raw wire data, so their Raw view is the same with or without
    // it; only the top-level list has rows to lose.
    const rawUnavailable = rawFetched && raw === undefined && childIndex === undefined;

    return (
        <BaseInstructionCard
            title={title}
            result={result}
            index={index}
            ix={ix}
            defaultRaw={defaultRaw}
            childCards={childCards}
            eventCards={eventCards}
            childIndex={childIndex}
            raw={raw}
            onRequestRaw={canFetchRaw ? () => fetchRaw(signature) : undefined}
            rawUnavailable={rawUnavailable}
            headerButtons={headerButtons}
            collapsible={collapsible}
        >
            {children}
        </BaseInstructionCard>
    );
}
