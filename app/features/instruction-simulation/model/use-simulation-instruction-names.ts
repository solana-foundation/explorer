import { type NamedInstruction, resolveNamesFromData } from '@entities/transaction-data';
import { useResolvedInstructionNames } from '@entities/transaction-data/client';
import type { PublicKey, VersionedMessage } from '@solana/web3.js';
import { useEffect, useMemo } from 'react';

import { Logger } from '@/app/shared/lib/logger';

/** What the resolved keys and the message disagreed about, when they do. */
type KeyIndexMismatch = { accountKeyCount: number; programIdIndex: number };

/**
 * The named rows, plus `unresolvable` to tell "we refused to name this message" from the ordinary
 * "the simulation has not run yet". Both yield no rows, and only the first owes the user an explanation.
 */
export type SimulationInstructionNames = {
    instructions: NamedInstruction[];
    unresolvable: boolean;
};

export function useSimulationInstructionNames({
    message,
    accountKeys,
}: {
    message: VersionedMessage;
    accountKeys: readonly PublicKey[] | undefined;
}): SimulationInstructionNames {
    const { rows, mismatch } = useMemo(() => resolveRows(message, accountKeys), [message, accountKeys]);

    // Reported from an effect rather than from the memo above: a memo runs twice per render under
    // StrictMode and again on every recompute, which would duplicate the Sentry event.
    useEffect(() => {
        if (!mismatch) return;
        Logger.error(new Error('Simulated instruction references an account index beyond the resolved keys'), {
            sentry: true,
            sentryExtras: mismatch,
        });
    }, [mismatch]);

    const instructions = useResolvedInstructionNames(rows);

    return useMemo(() => ({ instructions, unresolvable: Boolean(mismatch) }), [instructions, mismatch]);
}

function resolveRows(
    message: VersionedMessage,
    accountKeys: readonly PublicKey[] | undefined,
): { rows: NamedInstruction[]; mismatch?: KeyIndexMismatch } {
    if (!accountKeys) return { rows: [] };

    const rows: NamedInstruction[] = [];
    for (const ix of message.compiledInstructions) {
        const programId = accountKeys[ix.programIdIndex];
        if (!programId) {
            return { mismatch: { accountKeyCount: accountKeys.length, programIdIndex: ix.programIdIndex }, rows: [] };
        }
        rows.push({ ...resolveNamesFromData({ data: ix.data, programId }), data: ix.data, programId });
    }

    return { rows };
}
