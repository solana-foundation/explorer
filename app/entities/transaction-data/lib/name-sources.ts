import { type ProgramIdlNames } from '@entities/idl/@x/transaction-data';
import { resolveLighthouseInstructionName } from '@entities/lighthouse/@x/transaction-data';
import { resolveZkElGamalProofName } from '@entities/zk-elgamal-proof/@x/transaction-data';
import { resolveMangoInstructionName } from '@explorer/decoder-mango/detection';
import { resolveSerumInstructionName } from '@explorer/decoder-serum/detection';

import { resolveComputeBudgetInstructionName } from './compute-budget-name';
import { resolveMemoInstructionName } from './memo-name';
import { resolveProgramClientInstructionName } from './program-client-name';
import type { InstructionNameLookup, InstructionNames, InstructionSummary, ResolvedNames } from './types';

type NameSource = (lookup: InstructionNameLookup, idlNames: Map<string, ProgramIdlNames>) => string | undefined;

/**
 * Name sources tried in order; the first to return a name wins.
 *
 * Only the last needs the IDL fetch, which is why an empty `idlNames` map still names most instructions.
 * The IDL is the default for any program not listed here; every entry above it is an exception with a
 * reason it cannot come from one — see "Why not use the IDL for everything?" in the entity README.
 */
const NAME_SOURCES: readonly NameSource[] = [
    // First because it hits most often — Compute Budget sits on nearly every transaction.
    lookup => resolveComputeBudgetInstructionName(lookup),
    lookup => resolveMemoInstructionName(lookup),
    ({ programId, data }) => resolveZkElGamalProofName(programId, data),
    ({ programId, data }) => resolveLighthouseInstructionName(programId, data),
    ({ programId, data }) => resolveMangoInstructionName(programId, data),
    ({ programId, data }) => resolveSerumInstructionName(programId, data),
    // Ahead of the IDL so a simulated System/Token instruction is worded as the RPC words it — see the
    // override map in program-client-name.
    lookup => resolveProgramClientInstructionName(lookup),
    ({ programId, data }, idlNames) => idlNames.get(programId)?.resolveInstructionName?.(data),
];

/**
 * The names a lookup resolves to. Both fields are undefined when nothing names it, so callers keep their
 * own fallback.
 *
 * Hook-free: the caller passes the IDL names in, so one SWR entry serves a whole transaction and naming
 * an instruction never fetches.
 * @param lookup - The program + data lookup from `resolveInstructionNames`
 * @param idlNames - IDL-derived names per program id, for the programs in this transaction
 */
export function resolveNamesFromLookup(
    lookup: InstructionNameLookup,
    idlNames: Map<string, ProgramIdlNames>,
): ResolvedNames {
    return {
        name: resolveName(lookup, idlNames),
        programName: idlNames.get(lookup.programId)?.programName,
    };
}

/**
 * `names` with every gap a source can fill filled in. An unresolved field leaves the existing name
 * standing, so this is safe to apply to every row. Returns names only — a caller carrying a `programId`
 * re-attaches it.
 *
 * The single owner of the `nameLookup` rule; both row shapes go through here, so neither can drift.
 * @param names - The names resolved from the transaction alone
 * @param idlNames - IDL-derived names per program id, for the programs in this transaction
 */
export function applyNameSources(names: InstructionNames, idlNames: Map<string, ProgramIdlNames>): InstructionNames {
    if (!names.nameLookup) return { name: names.name, programName: names.programName };

    const resolved = resolveNamesFromLookup(names.nameLookup, idlNames);
    const name = resolved.name ?? names.name;
    const programName = resolved.programName ?? names.programName;

    // Dropped only once the row is named. Dropping it earlier strands the row — no later fetch has
    // anything left to resolve; keeping it later invites a second pass that flips the name back to the
    // sentinel whenever that fetch is slow or fails.
    if (name === names.name) return { name, nameLookup: names.nameLookup, programName };

    return { name, programName };
}

/**
 * `applyNameSources` for summary rows. Only the shape differs: a summary's names are always displayable
 * strings, so an unresolved field falls back to its sentinel rather than to `undefined`.
 * @param summaries - Summary rows for one signature, names still at their sentinels
 * @param idlNames - IDL-derived names per program id, for the programs in this transaction
 */
export function applyNameSourcesToSummaries(
    summaries: InstructionSummary[],
    idlNames: Map<string, ProgramIdlNames>,
): InstructionSummary[] {
    return summaries.map(summary => {
        if (!summary.nameLookup) return summary;

        const {
            name = summary.name,
            programName = summary.programName,
            nameLookup,
        } = applyNameSources(summary, idlNames);
        // Identity is preserved while nothing resolves, so a memoizing consumer does not re-render on
        // every IDL fetch that lands without naming this row.
        if (name === summary.name && programName === summary.programName) return summary;

        return nameLookup ? { name, nameLookup, programName } : { name, programName };
    });
}

function resolveName(lookup: InstructionNameLookup, idlNames: Map<string, ProgramIdlNames>): string | undefined {
    for (const source of NAME_SOURCES) {
        const name = source(lookup, idlNames);
        if (name !== undefined) return name;
    }
    return undefined;
}
