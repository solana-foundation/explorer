import { type IdlSource, useProgramIdls } from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { TransactionInstruction } from '@solana/web3.js';
import { useMemo } from 'react';

import {
    type FullIdlInstructionDecode,
    type IdlInstructionDecode,
    isFullyDecoded,
    safeDecodeInstructionWithIdl,
} from '../lib/decode-instruction-with-idl';

export type SourcedIdlInstructionDecode =
    | (IdlInstructionDecode & { source: Exclude<IdlSource, 'custom'> })
    | (FullIdlInstructionDecode & { source: 'custom' })
    | { kind: 'failed'; source: 'custom' };

export type IdlInstructionDecodeResult = SourcedIdlInstructionDecode | { kind: 'pending' } | undefined;

const PENDING = { kind: 'pending' } as const;

const FAILED = { kind: 'failed', source: 'custom' } as const;

/**
 * Decodes `raw` with the program's first IDL candidate, for the tx page and the inspector.
 * Returns `pending` for a raw instruction while the store reads the stored selection, so a custom IDL takes
 * precedence from the first render. Returns `undefined` without a candidate or without `raw`.
 */
export function useIdlInstructionDecode({
    programId,
    raw,
}: {
    programId: string;
    raw: TransactionInstruction | undefined;
}): IdlInstructionDecodeResult {
    const { cluster, url } = useCluster();
    const { candidates, stored } = useProgramIdls(programId, url, cluster);
    const candidate = candidates?.at(0);
    const isPending = raw !== undefined && stored.status === 'loading';

    return useMemo(() => {
        if (isPending) return PENDING;
        if (!candidate || !raw) return undefined;
        const decode = safeDecodeInstructionWithIdl(raw, candidate.idl, url);
        if (candidate.source !== 'custom') return { ...decode, source: candidate.source };
        // A custom IDL decodes strictly, so any decode that is not full is a failure.
        return isFullyDecoded(decode) ? { ...decode, source: 'custom' } : FAILED;
    }, [candidate, isPending, raw, url]);
}
