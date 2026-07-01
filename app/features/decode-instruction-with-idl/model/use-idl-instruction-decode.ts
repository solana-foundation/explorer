import { useAnchorProgram } from '@entities/idl';
import { useProgramMetadataIdl } from '@entities/program-metadata';
import { useCluster } from '@providers/cluster';
import { TransactionInstruction } from '@solana/web3.js';
import { useMemo } from 'react';

import { type IdlInstructionDecode, safeDecodeInstructionWithIdl } from '../lib/decode-instruction-with-idl';

/**
 * The dynamic decode tier shared by the tx page and the inspector: resolve a program's IDL (PMP-published
 * preferred over the legacy Anchor IDL) and decode `raw` against it. Returns undefined when the program has
 * no IDL, or there's no raw instruction to decode (RPC-pre-parsed) — the caller then falls through to its
 * remaining tiers. The decode is memoized so the Anchor Program / Borsh coder isn't rebuilt on every
 * re-render. The precedence and the panic→Unknown degrade (in `safeDecodeInstructionWithIdl`) live here so
 * the two surfaces can't drift.
 */
export function useIdlInstructionDecode({
    programId,
    raw,
}: {
    programId: string;
    raw: TransactionInstruction | undefined;
}): IdlInstructionDecode | undefined {
    const { cluster, url } = useCluster();
    const { idl: anchorIdl } = useAnchorProgram(programId, url, cluster);
    const { programMetadataIdl } = useProgramMetadataIdl(programId, url, cluster);

    const idl = programMetadataIdl ?? anchorIdl;
    return useMemo(() => (idl && raw ? safeDecodeInstructionWithIdl(raw, idl, url) : undefined), [idl, raw, url]);
}
