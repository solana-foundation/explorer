import { decodePmpInstructionData } from '@entities/pmp-instruction';
import type { TransactionInstruction } from '@solana/web3.js';

import { PMP_ADDRESS, PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX } from './constants';
import type { PmpContentInstruction } from './types';

/**
 * Decodes a content-carrying PMP instruction into the card's view model.
 *
 * The wire layout lives in `@entities/pmp-instruction`, so this module is only the ACCOUNT half: which of the
 * instruction's accounts hold the bytes, and which one is the metadata PDA. That is the part a
 * `TransactionInstruction` supplies and raw data bytes cannot.
 *
 * Returns undefined for the six housekeeping instructions and for any shape the decoders reject, so the caller
 * falls through to its remaining tiers (the dynamic IDL card, then Unknown) exactly as it does today.
 */
export function decodePmpContentInstruction(ix: TransactionInstruction): PmpContentInstruction | undefined {
    const decoded = decodePmpInstructionData(ix.data);
    if (!decoded) return undefined;

    if (decoded.kind === 'setData') {
        return {
            config: decoded.config,
            dataSource: decoded.dataSource,
            kind: 'setData',
            payload: decoded.payload,
            // A 5-byte setData with `buffer == programId` is InvalidInstructionData on chain, so "no payload plus a
            // foreign buffer at index 2" is the only reachable buffer-sourced shape.
            sourceBuffer: decoded.payload ? undefined : sourceBufferAt(ix),
        };
    }

    if (decoded.kind === 'initialize') {
        return {
            config: decoded.config,
            dataSource: decoded.dataSource,
            kind: 'initialize',
            // The in-place path finalises bytes already written to the metadata PDA at account index 0.
            metadataAccount: ix.keys[0]?.pubkey.toBase58(),
            payload: decoded.payload,
            seed: decoded.seed,
        };
    }

    return {
        chunk: decoded.chunk,
        kind: 'write',
        offset: decoded.offset,
        sourceBuffer: decoded.chunk ? undefined : sourceBufferAt(ix),
    };
}

/** The optional buffer/sourceBuffer slot. Codama's "programId" strategy fills an omitted optional with the id. */
function sourceBufferAt(ix: TransactionInstruction): string | undefined {
    const account = ix.keys[PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX]?.pubkey.toBase58();
    return account && account !== PMP_ADDRESS ? account : undefined;
}
