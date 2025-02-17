import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { useMemo } from 'react';
import useSWR from 'swr';

import { formatIdl } from '../utils/convertLegacyIdl';
import { useIdlFromMetadataProgram } from './idl';

function getProvider(url: string) {
    return new AnchorProvider(new Connection(url), new NodeWallet(Keypair.generate()), {});
}

export function useIdlFromAnchorProgramSeed(programAddress: string, url: string, useSuspense = true): Idl | null {
    const { data: idl } = useSWR(
        [`anchor-idl`, programAddress, url],
        async () => {
            try {
                const programId = new PublicKey(programAddress);
                const idl = await Program.fetchIdl<Idl>(programId, getProvider(url));

                if (!idl) {
                    throw new Error(`Anchor IDL not found for program: ${programAddress}`);
                }

                return idl;
            } catch (error) {
                return null;
            }
        },
        {
            revalidateOnFocus: false,
            suspense: useSuspense,
        }
    );

    return idl ?? null;
}

export function useAnchorProgram(
    programAddress: string,
    url: string
): { program: Program<Idl> | null; idl: Idl | null } {
    // Can't use suspense here because it will early return & not obey rules of hooks
    const idlFromAnchorProgram = useIdlFromAnchorProgramSeed(programAddress, url, false);
    const idlFromMetadataProgram = useIdlFromMetadataProgram(programAddress, url, false);

    const idl = idlFromAnchorProgram || idlFromMetadataProgram;

    const program = useMemo(() => {
        if (!idl) return null;

        try {
            return new Program(formatIdl(idl, programAddress), getProvider(url));
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
