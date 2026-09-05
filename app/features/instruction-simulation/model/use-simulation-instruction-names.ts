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

/**
 * One row per instruction — its program plus whatever names resolve — ready for `formatInstructionLogs`.
 *
 * A message queued for simulation is never RPC-parsed, so every name comes from the raw instruction
 * data: Compute Budget and the built-in discriminator resolvers synchronously, IDL-derived names once
 * the per-program fetch lands. Names resolve here rather than in the card so the card stays props-driven.
 * @param message - The simulated message, whose `compiledInstructions` set the row order
 * @param accountKeys - The simulation's lookup-table-resolved keys. Undefined before the simulation
 *   runs, which yields no rows: an outer program id normally sits in `staticAccountKeys`, but a
 *   deserialized Squads vault message can source one from a lookup table, and guessing would name the
 *   wrong program.
 */
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
            // Bail on the whole message, never drop the row: `formatInstructionLogs` pairs row `i` with
            // `instructionLogs[i]`, so a gap shifts every later CU figure onto the wrong instruction.
            // Reachable — web3.js checks lookup tables but never bounds-checks `programIdIndex`, and these
            // bytes come from the user — hence the report below rather than a silent skip.
            return { mismatch: { accountKeyCount: accountKeys.length, programIdIndex: ix.programIdIndex }, rows: [] };
        }
        rows.push({ ...resolveNamesFromData({ data: ix.data, programId }), programId });
    }

    return { rows };
}
