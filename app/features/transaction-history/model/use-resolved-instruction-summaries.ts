import { type ProgramIdlNames, useInstructionNameResolvers } from '@entities/idl';
import { resolveLighthouseInstructionName } from '@entities/lighthouse';
import { type InstructionNameLookup, type InstructionSummary } from '@entities/transaction-data';
import { resolveZkElGamalProofName } from '@entities/zk-elgamal-proof';
import { resolveMangoInstructionName } from '@explorer/decoder-mango/detection';
import { useCluster } from '@providers/cluster';
import { useMemo } from 'react';

import { useInstructionSummaries } from './use-instruction-summaries';

/**
 * Instruction summaries for one signature with their program and instruction names resolved from each
 * program's name source. Resolution is lifted here so the list/line components stay pure — they render
 * names, never fetch them. `enabled` gates the underlying (queued) transaction fetch so callers can defer
 * it until a row is visible. The IDL names are async (fetched per program); ZK ElGamal naming is a
 * synchronous discriminator lookup.
 */
export function useResolvedInstructionSummaries(signature: string, enabled = true): InstructionSummary[] | undefined {
    const { cluster, url } = useCluster();
    const summaries = useInstructionSummaries(signature, enabled);

    const resolvers = useInstructionNameResolvers(
        summaries?.flatMap(({ nameLookup }) => (nameLookup ? [nameLookup.programId] : [])) ?? [],
        cluster,
        url,
    );

    return useMemo(() => {
        if (summaries === undefined) return summaries;
        return summaries.map(summary => {
            const { nameLookup } = summary;
            if (!nameLookup) return summary;
            // The IDL names both the program and the instruction; the static `summary.program` /
            // `summary.name` stand in until the IDL fetch resolves (or for programs without an IDL).
            const name = resolveName(nameLookup, resolvers) ?? summary.name;
            const program = resolvers.get(nameLookup.programId)?.programName ?? summary.program;
            return name === summary.name && program === summary.program ? summary : { ...summary, name, program };
        });
    }, [summaries, resolvers]);
}

type NameSource = (lookup: InstructionNameLookup, idlNames: Map<string, ProgramIdlNames>) => string | undefined;

/**
 * Name sources tried in order; the first to return a name wins. Add a new source here — built-in
 * lookups read straight from `lookup`; IDL-derived names come from the fetched-per-program map.
 */
const NAME_SOURCES: NameSource[] = [
    ({ programId, discriminator }) => resolveZkElGamalProofName(programId, discriminator),
    ({ programId, discriminator }) => resolveLighthouseInstructionName(programId, discriminator),
    ({ programId, discriminator }) => resolveMangoInstructionName(programId, discriminator),
    ({ programId, discriminator }, idlNames) => idlNames.get(programId)?.resolveInstructionName?.(discriminator),
];

function resolveName(lookup: InstructionNameLookup, idlNames: Map<string, ProgramIdlNames>): string | undefined {
    for (const source of NAME_SOURCES) {
        const name = source(lookup, idlNames);
        if (name !== undefined) return name;
    }
    return undefined;
}
