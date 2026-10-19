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

/** Returns `pending` while the store reads the stored selection, so no card shows an on-chain decode first. */
export function useIdlInstructionDecode({
    programId,
    raw,
}: {
    programId: string;
    raw: TransactionInstruction | undefined;
}): IdlInstructionDecodeResult {
    const { cluster, url } = useCluster();
    const { idls, stored } = useProgramIdls(programId, url, cluster);
    const idl = idls?.at(0);
    const isPending = raw !== undefined && stored.status === 'loading';

    return useMemo(() => {
        if (isPending) return PENDING;
        if (!idl || !raw) return undefined;
        const decode = safeDecodeInstructionWithIdl(raw, idl.idl, url);
        if (idl.source !== 'custom') return { ...decode, source: idl.source };
        // A custom IDL decodes strictly, so any decode that is not full is a failure.
        return isFullyDecoded(decode) ? { ...decode, source: 'custom' } : FAILED;
    }, [idl, isPending, raw, url]);
}
