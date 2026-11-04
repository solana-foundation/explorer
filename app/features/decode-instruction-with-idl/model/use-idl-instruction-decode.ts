import { useProgramIdls } from '@entities/idl';
import { useCluster } from '@providers/cluster';
import { TransactionInstruction } from '@solana/web3.js';
import { useMemo } from 'react';

import { type IdlInstructionDecode, safeDecodeInstructionWithIdl } from '../lib/decode-instruction-with-idl';

export function useIdlInstructionDecode({
    programId,
    raw,
}: {
    programId: string;
    raw: TransactionInstruction | undefined;
}): IdlInstructionDecode | undefined {
    const { cluster, url } = useCluster();
    const { idls } = useProgramIdls(programId, url, cluster);

    // Try every published IDL, not only the first: getOnChainIdls lists the Program Metadata IDL ahead of
    // the Anchor PDA IDL, so a Codama PMP IDL that cannot decode this instruction must not shadow a legacy
    // Anchor IDL (converted to a codama root) that can — otherwise its instruction and events are lost.
    return useMemo(() => {
        if (!raw || !idls) return undefined;
        let lastDecode: IdlInstructionDecode | undefined;
        for (const { idl } of idls) {
            const decoded = safeDecodeInstructionWithIdl(raw, idl, url);
            if (decoded.kind !== 'unknown') return decoded;
            lastDecode = decoded;
        }
        return lastDecode;
    }, [idls, raw, url]);
}
