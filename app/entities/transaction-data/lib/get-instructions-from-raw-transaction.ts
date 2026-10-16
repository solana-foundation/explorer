import type { KitInstruction } from '@explorer/parsers';
import { toKitInstruction } from '@explorer/parsers/compat';
import { decompileTransactionMessage, getCompiledTransactionMessageDecoder } from '@solana/kit';

import type { RawTransaction } from '../model/types';

/**
 * The top-level instructions of a raw transaction with every account and the full data, for every message version.
 * Throws when a v1 message cannot be decompiled.
 */
export function getInstructionsFromRawTransaction(raw: RawTransaction): KitInstruction[] {
    // fetchRawTransaction resolves the lookup tables of legacy and v0 messages, and v1 messages have none
    if (raw.version !== 1) return raw.transaction.instructions.map(toKitInstruction);

    const compiled = getCompiledTransactionMessageDecoder().decode(raw.messageBytes);
    // The narrowed version selects Kit's v1 overload, whose instructions share one element type
    if (compiled.version !== 1) throw new Error(`Expected a v1 message, got version ${compiled.version}`);
    const message = decompileTransactionMessage(compiled);
    // Kit omits empty `accounts` and `data`, and KitInstruction carries plain account metas
    return message.instructions.map(instruction => ({
        accounts: (instruction.accounts ?? []).map(({ address, role }) => ({ address, role })),
        data: new Uint8Array(instruction.data ?? []),
        programAddress: instruction.programAddress,
    }));
}
