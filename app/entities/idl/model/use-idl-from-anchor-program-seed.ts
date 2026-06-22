'use client';

import { AnchorProvider, type Idl } from '@coral-xyz/anchor';
import NodeWallet from '@coral-xyz/anchor/dist/cjs/nodewallet';
import { Connection, Keypair } from '@solana/web3.js';
import useSWRImmutable from 'swr/immutable';

import { Cluster } from '@/app/utils/cluster';

import { fetchProgramIdls } from '../api/fetch-program-idls';
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
    // fetchIdlForProgram throws on a failed fetch (rather than caching null), so cap the retries SWR
    // makes before giving up on a persistently failing endpoint.
    const { data, isLoading } = useSWRImmutable(swrKey, fetchIdlForProgram, { errorRetryCount: 3 });
    return { idl: data ?? null, isLoading };
}

export function getProvider(url: string): AnchorProvider {
    return new AnchorProvider(new Connection(url), new NodeWallet(Keypair.generate()), {});
}

async function fetchIdlForProgram([, programAddress, cluster, url]: IdlSwrKey): Promise<Idl | null> {
    if (cluster === Cluster.Custom) {
        // Resolve client-side against the user's RPC via @solana/idl (same resolver as the route).
        // Lazily loaded so @solana/idl's weight stays out of the bundle for the known-cluster path.
        const idl = await resolveAnchorIdlClient({ programId: programAddress, url });
        return (idl as Idl) ?? null;
    }
    // Known clusters: read the Anchor IDL from the shared, CDN-cached /api/idl-latest payload.
    // fetchProgramIdls throws on a transient failure (rather than caching null) so SWR retries — see
    // its doc and this hook's errorRetryCount.
    const { anchorIdl } = await fetchProgramIdls(programAddress, cluster);
    return (anchorIdl as Idl) ?? null;
}
