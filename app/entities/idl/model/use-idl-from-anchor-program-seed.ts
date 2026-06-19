'use client';

import { AnchorProvider, type Idl } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair } from '@solana/web3.js';
import useSWRImmutable from 'swr/immutable';

import { Logger } from '@/app/shared/lib/logger';
import { Cluster } from '@/app/utils/cluster';

import { resolveAnchorIdlClient } from '../api/load-resolve-program-idls';

type IdlSwrKey = readonly ['idl-anchor', string, Cluster, string];

export function useIdlFromAnchorProgramSeed(
    programAddress: string,
    url: string,
    cluster?: Cluster,
): { idl: Idl | null; isLoading: boolean } {
    const resolvedCluster = cluster ?? Cluster.MainnetBeta;
    const swrKey: IdlSwrKey = ['idl-anchor', programAddress, resolvedCluster, url];
    // No suspense: it's rendered without a <Suspense> boundary in the transaction inspector,
    // where a thrown promise rolls back the render tree. Callers use `isLoading` instead.
    const { data, isLoading } = useSWRImmutable(swrKey, fetchIdlForProgram);
    return { idl: data ?? null, isLoading };
}

export function getProvider(url: string): AnchorProvider {
    return new AnchorProvider(new Connection(url), new NodeWallet(Keypair.generate()), {});
}

async function fetchIdlForProgram([, programAddress, cluster, url]: IdlSwrKey): Promise<Idl | null> {
    try {
        if (cluster === Cluster.Custom) {
            // Resolve client-side against the user's RPC via @solana/idl (same resolver as the route).
            // Lazily loaded so @solana/idl's weight stays out of the bundle for the known-cluster path.
            const idl = await resolveAnchorIdlClient({ programId: programAddress, url });
            return (idl as Idl) ?? null;
        }

        // Known clusters resolve server-side via @solana/idl. `pmp=0` returns the Anchor IDL only
        // (no PMP lookup / recency) — the anchor-only slice of /api/idl-latest.
        const response = await fetch(`/api/idl-latest?programAddress=${programAddress}&cluster=${cluster}&pmp=0`);
        if (!response.ok) {
            Logger.warn('[idl] /api/idl-latest returned non-OK status', {
                cluster,
                programAddress,
                status: response.status,
            });
            return null;
        }
        const { idls } = await response.json();
        return (idls?.anchor as Idl) ?? null;
    } catch (error) {
        Logger.error(new Error('[idl] Error fetching Anchor IDL', { cause: error }), { cluster, programAddress });
        return null;
    }
}
