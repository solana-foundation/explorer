import { toLegacyInstruction } from '@explorer/parsers/compat';
import type { TransactionInstruction } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';

import type { RawTransaction } from '../model/types';
import { getInstructionsFromRawTransaction } from './get-instructions-from-raw-transaction';

/** The top-level instructions of a raw transaction in web3.js form, or `undefined` when its message cannot be decompiled. */
export function readRawInstructions(raw: RawTransaction): TransactionInstruction[] | undefined {
    try {
        return getInstructionsFromRawTransaction(raw).map(toLegacyInstruction);
    } catch (error) {
        Logger.error(new Error('Could not decompile the raw transaction instructions', { cause: error }), {
            sentry: 'always',
            sentryExtras: { signature: raw.signatures[0], version: raw.version },
        });
        return undefined;
    }
}
