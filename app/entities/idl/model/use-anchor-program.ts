'use client';

import { Idl, Program } from '@coral-xyz/anchor';
import { useMemo } from 'react';

import { Cluster } from '@/app/utils/cluster';

import { formatSerdeIdl, getFormattedIdl } from './formatters/format';
import { getProvider, useIdlFromAnchorProgramSeed } from './use-idl-from-anchor-program-seed';

export function useAnchorProgram(
    programAddress: string,
    url: string,
    cluster?: Cluster
): { program: Program | null; idl: Idl | null } {
    // TODO(ngundotra): Rewrite this to be more efficient
    // const idlFromBinary = useIdlFromSolanaProgramBinary(programAddress);
    const idlFromAnchorProgram = useIdlFromAnchorProgramSeed(programAddress, url, cluster);
    const idl = idlFromAnchorProgram;
    const program: Program<Idl> | null = useMemo(() => {
        if (!idl) return null;

        try {
            const program = new Program(getFormattedIdl(formatSerdeIdl, idl, programAddress), getProvider(url));
            return program;
        } catch (e) {
            console.error('Error creating anchor program for', programAddress, e, { idl });
            return null;
        }
    }, [idl, programAddress, url]);

    return { idl, program };
}

export type AnchorAccount = {
    layout: string;
    account: object;
};
