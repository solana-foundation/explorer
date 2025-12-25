import { BaseInstructionCard, BaseProps } from '@components/common/BaseInstructionCard';
import { useFetchRawTransaction, useRawTransactionDetails } from '@providers/transactions/raw';
import { TransactionInstruction } from '@solana/web3.js';
import React, { useCallback, useContext } from 'react';

import { SignatureContext } from './SignatureContext';

type InstructionProps = BaseProps;

export function InstructionCard({
    childIndex,
    children,
    defaultRaw,
    index,
    innerCards,
    ix,
    result,
    title,
}: InstructionProps) {
    const signature = useContext(SignatureContext);
    const rawDetails = useRawTransactionDetails(signature);

    let raw: TransactionInstruction | undefined = undefined;
    if (rawDetails && childIndex === undefined) {
        raw = rawDetails?.data?.raw?.transaction.instructions[index];
    }

    const fetchRaw = useFetchRawTransaction();
    const fetchRawTrigger = useCallback(() => fetchRaw(signature), [signature, fetchRaw]);

    return (
        <BaseInstructionCard
            title={title}
            result={result}
            index={index}
            ix={ix}
            defaultRaw={defaultRaw}
            innerCards={innerCards}
            childIndex={childIndex}
            raw={raw}
            onRequestRaw={fetchRawTrigger}
        >
            {children}
        </BaseInstructionCard>
    );
}
