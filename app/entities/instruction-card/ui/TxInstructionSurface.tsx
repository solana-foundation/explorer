'use client';

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
    const rawInstructions = React.useMemo<RawInstructions>(
        () =>
            rawDetails?.status === FetchStatus.Fetched
                ? { instructions: rawDetails.data?.raw?.transaction?.instructions, status: 'fetched' }
                : { fetch: () => fetchRaw(signature), status: 'fetchable' },
        [fetchRaw, rawDetails, signature],
    );
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
