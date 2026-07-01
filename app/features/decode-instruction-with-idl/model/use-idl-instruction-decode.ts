import { useAnchorProgram } from '@entities/idl';
import { useProgramMetadataIdl } from '@entities/program-metadata';
import { useCluster } from '@providers/cluster';
import { TransactionInstruction } from '@solana/web3.js';
import { useMemo } from 'react';

import { type IdlInstructionDecode, safeDecodeInstructionWithIdl } from '../lib/decode-instruction-with-idl';

/**
 * Resolve the dynamic IDL for a program, shared by the tx page and the inspector: a PMP-published IDL is
 * preferred over the legacy Anchor IDL. `idl` is undefined when the program has none. This is the cheap,
 * hooks-only half of the decode tier — callers that only reach the tier conditionally (e.g. the tx page,
 * where the IDL tier is last) can resolve here and decode lazily with `safeDecodeInstructionWithIdl`,
 * avoiding wasted decode work for instructions an earlier tier handles. The precedence lives here so the
 * two surfaces can't drift.
 */
export function useResolvedProgramIdl({ programId }: { programId: string }): { idl: unknown; url: string } {
    const { cluster, url } = useCluster();
    const { idl: anchorIdl } = useAnchorProgram(programId, url, cluster);
    const { programMetadataIdl } = useProgramMetadataIdl(programId, url, cluster);

    return { idl: programMetadataIdl ?? anchorIdl ?? undefined, url };
}

/**
 * Eager convenience over {@link useResolvedProgramIdl}: resolve the program's IDL and decode `raw` against
 * it. Returns undefined when the program has no IDL, or there's no raw instruction to decode
 * (RPC-pre-parsed) — the caller then falls through to its remaining tiers. Suited to surfaces where the
 * IDL tier is checked first (the inspector); the tx page resolves + decodes lazily instead.
 */
export function useIdlInstructionDecode({
    programId,
    raw,
}: {
    programId: string;
    raw: TransactionInstruction | undefined;
}): IdlInstructionDecode | undefined {
    const { idl, url } = useResolvedProgramIdl({ programId });
    return useMemo(() => (idl && raw ? safeDecodeInstructionWithIdl(raw, idl, url) : undefined), [idl, raw, url]);
}
