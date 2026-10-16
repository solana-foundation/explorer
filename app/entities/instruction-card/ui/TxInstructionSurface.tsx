'use client';

import { readRawInstructions } from '@entities/transaction-data/@x/instruction-card';
import { FetchStatus } from '@providers/cache';
import { useFetchRawTransaction, useRawTransactionDetails } from '@providers/transactions/raw';
import type { TransactionSignature } from '@solana/web3.js';
import React from 'react';

import type { RawInstructions } from '../model/raw-source';
import type { InstructionSurface } from '../model/surface';
import { InstructionSurfaceProvider } from '../model/surface';

/**
 * Declares how instruction cards render on the transaction page.
 *
 * Lives here rather than in the transaction feature so tests that render a card
 * in isolation can pick a surface without reaching across layers.
 */
export function TxInstructionSurface({
    result,
    signature,
    Card,
    instructionData,
    children,
}: Pick<InstructionSurface, 'Card' | 'instructionData' | 'result'> & {
    signature: TransactionSignature;
    children: React.ReactNode;
}) {
    const rawDetails = useRawTransactionDetails(signature);
    const fetchRaw = useFetchRawTransaction();
    const rawInstructions = React.useMemo<RawInstructions>(() => {
        const fetch = () => fetchRaw(signature);
        if (rawDetails?.status === FetchStatus.Fetched) {
            const raw = rawDetails.data?.raw;
            return { instructions: raw ? readRawInstructions(raw) : undefined, status: 'fetched' };
        }
        return rawDetails?.status === FetchStatus.FetchFailed
            ? { fetch, status: 'failed' }
            : { fetch, status: 'fetchable' };
    }, [fetchRaw, rawDetails, signature]);
    const surface = React.useMemo<InstructionSurface>(
        () => ({
            Card,
            collapsible: false,
            instructionData,
            rawInstructions,
            result,
            signature,
            validateProgram: false,
        }),
        [Card, instructionData, rawInstructions, result, signature],
    );

    return <InstructionSurfaceProvider surface={surface}>{children}</InstructionSurfaceProvider>;
}
