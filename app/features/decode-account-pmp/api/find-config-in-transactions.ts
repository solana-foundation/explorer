import { toErrorReason } from '@entities/pmp-account';
import type { Connection } from '@solana/web3.js';
import { PublicKey } from '@solana/web3.js';

import { Logger } from '@/app/shared/lib/logger';

import {
    type ConfigResolutionFromTxResult,
    resolveConfigFromTransaction,
} from '../lib/config-resolution/resolve-buffer-config-from-transaction';

// The maximum number of last signatures to scan for a config.
export const PMP_LOOKUP_MAX_SIGNATURES = 8;

/**
 * What the whole history scan concluded: either a transaction resolved a config, or one of three reasons it did not.
 *
 * `not-found` and `max-signatures-limit` are kept apart because they mean different things - one is a buffer whose
 * config does not exist on chain yet, the other is a buffer whose commit fell off the end of the scan.
 */
export type ConfigResolutionOnchainResult =
    ConfigResolutionFromTxResult | { kind: 'max-signatures-limit' } | { kind: 'failed'; reason: string };

/**
 * Walks a buffer's recent history newest-first and returns the first config any transaction resolved.
 *
 * The buffer IS one of `setData`'s accounts, so it appears in its own `getSignaturesForAddress` index and no
 * instruction-level RPC filter is needed - Solana indexes transactions by address only. Histories are short and the
 * consuming instruction is normally the newest signature, so this is typically 1 to 2 `getTransaction` calls.
 *
 * Never throws: every failure arrives on the union.
 */
export async function findConfigInTransactions(
    connection: Connection,
    bufferAddress: string,
): Promise<ConfigResolutionOnchainResult> {
    try {
        const signatures = await connection.getSignaturesForAddress(new PublicKey(bufferAddress), {
            limit: PMP_LOOKUP_MAX_SIGNATURES,
        });

        for (const entry of signatures) {
            // A failed transaction never wrote a header, so its declared config was never committed.
            if (entry.err) continue;

            const tx = await connection.getTransaction(entry.signature, { maxSupportedTransactionVersion: 0 });
            if (!tx || tx.meta?.err) continue;

            // Newest wins: a later setData supersedes an earlier one, so the first match ends the scan. Tested on
            // `kind` and NOT on truthiness - the resolver is total and answers `not-found` for a transaction that
            // resolved nothing, so a truthiness check would stop on the very first signature every time.
            const result = resolveConfigFromTransaction(tx, bufferAddress, entry.signature);
            if (result.kind !== 'not-found') return result;
        }

        return signatures.length >= PMP_LOOKUP_MAX_SIGNATURES
            ? { kind: 'max-signatures-limit' }
            : { kind: 'not-found' };
    } catch (error) {
        const reason = toErrorReason(error, 'unknown lookup error');

        // The card reports only THAT the scan did not complete, never this string, and console logging is suppressed
        // outright on the client - so Sentry is the one place the reason survives. Warn rather than error: a dead scan
        // costs two config rows and leaves the from-bytes result, and the document it decodes, standing.
        Logger.warn('[pmp:find-config-in-transactions] buffer config scan failed', {
            sentry: true,
            sentryExtras: { bufferAddress, reason },
        });

        return { kind: 'failed', reason };
    }
}
