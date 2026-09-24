import { getBase58Encoder } from '@solana/kit';
import type { ParsedTransaction } from '@solana/web3.js';

import type { SiblingInstructionData } from './ed25519-decode';

const BASE58_ENCODER = getBase58Encoder();

/** Sibling lookup over a tx-page transaction, whose raw instructions carry base58 data. */
export function siblingDataFromParsedTransaction(tx: ParsedTransaction): SiblingInstructionData {
    return index => {
        const target = tx.message.instructions[index];
        // An RPC-parsed neighbour carries no wire data, so its offsets cannot be followed.
        if (!target || !('data' in target)) {
            return undefined;
        }
        try {
            return BASE58_ENCODER.encode(target.data);
        } catch {
            return undefined;
        }
    };
}
