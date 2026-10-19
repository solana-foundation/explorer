import { toLegacyInstruction } from '@explorer/parsers/compat';
import type { TransactionInstruction } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';

import type { RawTransaction } from '../model/types';
import {
    getInnerInstructionsFromRawTransaction,
    getInstructionsFromRawTransaction,
} from './get-instructions-from-raw-transaction';

/** The top-level instructions of a raw transaction in web3.js form, or `undefined` when its message cannot be decompiled. */
export function readRawInstructions(raw: RawTransaction): TransactionInstruction[] | undefined {
    try {
        return getInstructionsFromRawTransaction(raw).map(toLegacyInstruction);
    } catch (error) {
        Logger.error(
            new Error('Could not decompile the raw transaction instructions', { cause: error }),
            browserReport(raw),
        );
        return undefined;
    }
}

/**
 * The inner instructions of a raw transaction in web3.js form, keyed by the index of the top-level instruction that
 * invoked them, or `undefined` when they cannot be resolved.
 */
export function readRawInnerInstructions(
    raw: RawTransaction,
): Map<number, (TransactionInstruction | undefined)[]> | undefined {
    try {
        return new Map(
            [...getInnerInstructionsFromRawTransaction(raw)].map(([index, instructions]) => [
                index,
                instructions.map(ix => ix && toLegacyInstruction(ix)),
            ]),
        );
    } catch (error) {
        Logger.error(
            new Error('Could not resolve the raw transaction inner instructions', { cause: error }),
            browserReport(raw),
        );
        return undefined;
    }
}

function browserReport(raw: RawTransaction) {
    return { sentry: 'always', sentryExtras: { signature: raw.signatures[0], version: raw.version } } as const;
}
