import {
    getInnerInstructionsFromRawTransaction,
    getInstructionsFromRawTransaction,
    type RawTransaction,
} from '@entities/transaction-data';
import type { KitInstruction } from '@explorer/parsers';

import { Logger } from '@/app/shared/lib/logger';

export function readRawInstructions(raw: RawTransaction): KitInstruction[] | undefined {
    try {
        return getInstructionsFromRawTransaction(raw);
    } catch (error) {
        Logger.error(
            new Error('Could not decompile the raw transaction instructions', { cause: error }),
            browserReport(raw),
        );
        return undefined;
    }
}

export function readRawInnerInstructions(raw: RawTransaction): Map<number, (KitInstruction | undefined)[]> | undefined {
    try {
        return getInnerInstructionsFromRawTransaction(raw);
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
