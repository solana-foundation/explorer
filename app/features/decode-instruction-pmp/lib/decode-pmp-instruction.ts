import { decodePmpInstructionData } from '@entities/pmp-instruction';
import type { Address } from '@solana/kit';
import type { TransactionInstruction } from '@solana/web3.js';

import { toKitAddress } from '@/app/shared/lib/web3js-compat';

import { PMP_ADDRESS, PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX } from './constants';
import type { PmpBytesSource, PmpContentInstruction } from './types';

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
        if (decoded.dataSource === undefined) {
            return { config: decoded.config, kind: 'setData' };
        }
        return {
            config: decoded.config,
            kind: 'setData',
            payload: {
                dataSource: decoded.dataSource,
                source: bytesSource(decoded.payload, sourceBufferAt(ix)),
            },
        };
    }

    if (decoded.kind === 'initialize') {
        const metadataAccount = ix.keys[0];
        return {
            config: decoded.config,
            kind: 'initialize',
            payload: {
                dataSource: decoded.dataSource,
                source: bytesSource(decoded.payload, metadataAccount && toKitAddress(metadataAccount.pubkey)),
            },
            seed: decoded.seed,
        };
    }

    return { chunk: bytesSource(decoded.chunk, sourceBufferAt(ix)), kind: 'write', offset: decoded.offset };
}

function bytesSource(bytes: Uint8Array | undefined, account: Address | undefined): PmpBytesSource {
    if (bytes) return { bytes, kind: 'inline' };
    if (account) return { account, kind: 'account' };
    return { kind: 'absent' };
}

/** The optional buffer/sourceBuffer slot. Codama's "programId" strategy fills an omitted optional with the id. */
function sourceBufferAt(ix: TransactionInstruction): Address | undefined {
    const pubkey = ix.keys[PMP_OPTIONAL_BUFFER_ACCOUNT_INDEX]?.pubkey;
    const account = pubkey && toKitAddress(pubkey);
    return account && account !== PMP_ADDRESS ? account : undefined;
}
