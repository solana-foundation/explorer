import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { useFetchRawTransaction, useRawTransactionDetails } from '@providers/transactions/raw';
import { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React, { useCallback, useContext } from 'react';

import { SignatureContext } from './SignatureContext';

type InstructionProps = {
    title: string;
    children?: React.ReactNode;
    result: SignatureResult;
    index: number;
    ix: TransactionInstruction | ParsedInstruction;
    defaultRaw?: boolean;
    innerCards?: JSX.Element[];
    eventCards?: JSX.Element[];
    childIndex?: number;
    // Raw instruction for displaying accounts and hex data in raw mode (used by inspector)
    raw?: TransactionInstruction;
};

export function InstructionCard({
    title,
    children,
    result,
    index,
    ix,
    defaultRaw,
    innerCards,
    eventCards,
    childIndex,
    raw: rawProp,
}: InstructionProps) {
    const signature = useContext(SignatureContext);
    const rawDetails = useRawTransactionDetails(signature);

    // Use provided raw prop, or fetch from transaction details
    let raw: TransactionInstruction | undefined = rawProp;
    if (!raw && rawDetails && childIndex === undefined) {
        raw = rawDetails?.data?.raw?.transaction.instructions[index];
    }

    const fetchRaw = useFetchRawTransaction();
    const fetchRawTrigger = useCallback(() => fetchRaw(signature), [signature, fetchRaw]);

    // Only allow fetching raw data if we have a valid signature (not in inspector mode)
    const canFetchRaw = signature && !raw;

    return (
        <BaseInstructionCard
            title={title}
            result={result}
            index={index}
            ix={ix}
            defaultRaw={defaultRaw}
            innerCards={innerCards}
            eventCards={eventCards}
            childIndex={childIndex}
            raw={raw}
            onRequestRaw={canFetchRaw ? fetchRawTrigger : undefined}
        >
            {children}
        </BaseInstructionCard>
    );
}
