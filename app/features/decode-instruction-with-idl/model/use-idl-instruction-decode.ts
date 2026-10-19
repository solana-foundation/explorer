import { useProgramIdls } from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { TransactionInstruction } from '@solana/web3.js';
import { useMemo } from 'react';

import { type IdlInstructionDecode, safeDecodeInstructionWithIdl } from '../lib/decode-instruction-with-idl';

/**
 * Decodes `raw` with the program's first IDL candidate, for the tx page and the inspector.
 * Returns `undefined` without a candidate or without `raw`.
 */
export function useIdlInstructionDecode({
    programId,
    raw,
}: {
    programId: string;
    raw: TransactionInstruction | undefined;
}): IdlInstructionDecode | undefined {
    const { cluster, url } = useCluster();
    const { candidates } = useProgramIdls(programId, url, cluster);
    const idl = candidates?.at(0)?.idl;

    return useMemo(() => (idl && raw ? safeDecodeInstructionWithIdl(raw, idl, url) : undefined), [idl, raw, url]);
}
