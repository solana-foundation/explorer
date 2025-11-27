'use client';

import { Idl, Program } from '@coral-xyz/anchor';
import { IdlMetadata } from '@coral-xyz/anchor/dist/cjs/idl';
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

/**
 * Various IDLs have different logic behind keeping program address in it.
 * This helper should leverage different variants of these IDLs
 *
 * @param idl
 * @returns
 */
export function normalizeIdl(idl: Idl, fallbackAddress?: string): Idl {
    type RichMetadata = IdlMetadata & { address?: string };

    let programAddress = (idl.metadata as RichMetadata)?.address ?? idl.address;
    if (fallbackAddress) programAddress = fallbackAddress;
    return {
        ...idl,
        address: programAddress,
    };
}

export type AnchorAccount = {
    layout: string;
    account: object;
};
