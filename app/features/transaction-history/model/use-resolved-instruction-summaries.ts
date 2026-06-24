import { type InstructionNameResolver, useInstructionNameResolvers } from '@entities/idl';
import { type InstructionNameLookup, type InstructionSummary } from '@entities/transaction-data';
import { resolveZkElGamalProofName } from '@entities/zk-elgamal-proof';
import { useCluster } from '@providers/cluster';
import { useMemo } from 'react';

import { useInstructionSummaries } from './use-instruction-summaries';

/**
 * Instruction summaries for one signature with their names resolved from each program's name source.
 * Resolution is lifted here so the list/line components stay pure — they render names, never fetch them.
 * `enabled` gates the underlying (queued) transaction fetch so callers can defer it until a row is visible.
 * The IDL resolver is async (fetched per program); ZK ElGamal naming is a synchronous discriminator lookup.
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
            const name = summary.nameLookup && resolveName(summary.nameLookup, resolvers);
            return name ? { ...summary, name } : summary;
        });
    }, [summaries, resolvers]);
}

type NameSource = (
    lookup: InstructionNameLookup,
    idlResolvers: Map<string, InstructionNameResolver>,
) => string | undefined;

/**
 * Name sources tried in order; the first to return a name wins. Add a new source here — built-in
 * lookups read straight from `lookup`; IDL-derived names come from the fetched-per-program map.
 */
const NAME_SOURCES: NameSource[] = [
    ({ programId, discriminator }) => resolveZkElGamalProofName(programId, discriminator),
    ({ programId, discriminator }, idlResolvers) => idlResolvers.get(programId)?.(discriminator),
];

function resolveName(
    lookup: InstructionNameLookup,
    idlResolvers: Map<string, InstructionNameResolver>,
): string | undefined {
    for (const source of NAME_SOURCES) {
        const name = source(lookup, idlResolvers);
        if (name !== undefined) return name;
    }
    return undefined;
}
