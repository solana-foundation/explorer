'use client';

import { AnchorProvider, type Idl, Program } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

type IdlSwrKey = readonly ['idl-anchor', string, Cluster, string];

export function useIdlFromAnchorProgramSeed(programAddress: string, url: string, cluster?: Cluster): Idl | null {
    const resolvedCluster = cluster ?? Cluster.MainnetBeta;
    const swrKey: IdlSwrKey = ['idl-anchor', programAddress, resolvedCluster, url];
    // Suspense: callers wrap this in <Suspense> to show loading cards (e.g. IdlCard,
    // InstructionsSection, ProgramMultisigCard) while the IDL request is in flight.
    const { data } = useSWRImmutable(swrKey, fetchIdlForProgram, { suspense: true });
    return data ?? null;
}

export function getProvider(url: string): AnchorProvider {
    return new AnchorProvider(new Connection(url), new NodeWallet(Keypair.generate()), {});
}

async function fetchIdlForProgram([, programAddress, cluster, url]: IdlSwrKey): Promise<Idl | null> {
    try {
        if (cluster === Cluster.Custom) {
            return await Program.fetchIdl<Idl>(new PublicKey(programAddress), getProvider(url));
        }

        const response = await fetch(`/api/anchor?programAddress=${programAddress}&cluster=${cluster}`);
        if (!response.ok) {
            Logger.warn('[idl] /api/anchor returned non-OK status', {
                cluster,
                programAddress,
                status: response.status,
            });
            return null;
        }
        const { idl } = await response.json();
        return idl ?? null;
    } catch (error) {
        Logger.error(new Error('[idl] Error fetching Anchor IDL', { cause: error }), { cluster, programAddress });
        return null;
    }
}
