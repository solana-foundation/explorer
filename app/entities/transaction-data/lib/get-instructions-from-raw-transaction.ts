import type { KitInstruction } from '@explorer/parsers';
import { toKitInstruction } from '@explorer/parsers/compat';
import { decompileTransactionMessage, getCompiledTransactionMessageDecoder } from '@solana/kit';
import { PublicKey } from '@solana/web3.js';

import { bridgeV1MessageBytes } from '@/app/shared/lib/v1-message-bridge';

import type { RawTransaction } from '../model/types';
import { resolveInnerInstructions } from './resolve-inner-instructions';

/**
 * The top-level instructions of a raw transaction with every account and the full data, for every message version.
 */
export function getInstructionsFromRawTransaction(raw: RawTransaction): KitInstruction[] {
    // fetchRawTransaction resolves the lookup tables of legacy and v0 messages, and v1 messages have none
    if (raw.version !== 1) return raw.transaction.instructions.map(toKitInstruction);

    const compiled = getCompiledTransactionMessageDecoder().decode(raw.messageBytes);
    if (compiled.version !== 1) throw new Error(`Expected a v1 message, got version ${compiled.version}`);

    const message = decompileTransactionMessage(compiled);
    return message.instructions.map(instruction => ({
        accounts: (instruction.accounts ?? []).map(({ address, role }) => ({ address, role })),
        data: new Uint8Array(instruction.data ?? []),
        programAddress: instruction.programAddress,
    }));
}

/**
 * The inner instructions of a raw transaction, keyed by the index of the top-level instruction that invoked them.
 * An inner instruction with an out-of-range account index stays `undefined`, so positions match the RPC list.
 */
export function getInnerInstructionsFromRawTransaction(
    raw: RawTransaction,
): Map<number, (KitInstruction | undefined)[]> {
    const innerInstructions = raw.meta?.innerInstructions;
    if (!innerInstructions) return new Map();

    const message = raw.version === 1 ? bridgeV1MessageBytes(raw.messageBytes).message : raw.message;
    const loaded = raw.meta?.loadedAddresses;
    const accountKeys = message.getAccountKeys({
        accountKeysFromLookups: loaded && {
            readonly: loaded.readonly.map(address => new PublicKey(address)),
            writable: loaded.writable.map(address => new PublicKey(address)),
        },
    });

    const byParentIndex = resolveInnerInstructions(innerInstructions, accountKeys, message);
    return new Map(
        [...byParentIndex].map(([index, instructions]) => [index, instructions.map(ix => ix && toKitInstruction(ix))]),
    );
}
