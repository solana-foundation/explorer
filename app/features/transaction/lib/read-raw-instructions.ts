import { getInstructionsFromRawTransaction, type RawTransaction } from '@entities/transaction-data';
import type { KitInstruction } from '@explorer/parsers';

import { Logger } from '@/app/shared/lib/logger';

export function readRawInstructions(raw: RawTransaction): KitInstruction[] | undefined {
    try {
        return getInstructionsFromRawTransaction(raw);
    } catch (error) {
        Logger.error(new Error('Could not decompile the raw transaction instructions', { cause: error }), {
            sentry: true,
        });
        return undefined;
    }
}
