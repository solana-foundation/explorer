import { isSolanaError, SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_INSTRUCTION } from '@solana/kit';

import { toHex } from '@/app/shared/lib/bytes';
import { Logger } from '@/app/shared/lib/logger';

import type { InstructionNameLookup } from './types';

/**
 * The instruction index a generated `@solana-program/*` client reads from a discriminator, or undefined
 * when it recognizes none.
 *
 * Catch-all because any throw here means "unrecognized", which is routine for an explorer. Most callers
 * run during render with no error boundary, so an escape would replace the whole page — failing to name
 * an instruction must never do that.
 *
 * Console, never Sentry. Every client raises the standard `FAILED_TO_IDENTIFY_INSTRUCTION` for a
 * discriminator it does not know, so that case returns silently and anything else is a client or caller
 * defect. It stays off Sentry only because nothing has shown it fires in practice — kit 7 normalized the
 * last two clients that threw a plain `Error`, so promoting it is now a reasonable next step.
 * @param identify - The client's generated `identify*` function
 * @param lookup - The program and the leading instruction bytes to match
 */
export function identifyInstruction(
    identify: (data: Uint8Array) => number,
    { programId, data }: InstructionNameLookup,
): number | undefined {
    try {
        return identify(data);
    } catch (e) {
        if (!isSolanaError(e, SOLANA_ERROR__PROGRAM_CLIENTS__FAILED_TO_IDENTIFY_INSTRUCTION)) {
            Logger.warn('[transaction-data] program client threw a non-standard identify error', {
                data: toHex(data),
                error: String(e),
                programId,
            });
        }
        return undefined;
    }
}
