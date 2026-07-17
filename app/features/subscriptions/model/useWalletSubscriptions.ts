'use client';

import { useCluster } from '@providers/cluster';
import { address, createSolanaRpc } from '@solana/kit';
import {
    type Delegation,
    fetchDelegationsByDelegatee,
    fetchDelegationsByDelegator,
    fetchPlansForOwner,
    type PlanWithAddress,
} from '@solana/subscriptions';
import { Cluster } from '@utils/cluster';
import useSWRImmutable from 'swr/immutable';

export type WalletDelegationsData = {
    delegations: Delegation[];
    delegationsReceived: Delegation[];
};

export type WalletPlansData = {
    plans: PlanWithAddress[];
};

const ENABLED_CLUSTERS = new Set([Cluster.MainnetBeta, Cluster.Devnet, Cluster.Custom]);

export function useWalletDelegations(walletAddress: string | null) {
    const { cluster, url } = useCluster();

    return useSWRImmutable(
        walletAddress !== null && ENABLED_CLUSTERS.has(cluster)
            ? (['wallet-delegations', walletAddress, url] as const)
            : undefined,
        async ([_prefix, addr, rpcUrl]) => {
            const rpc = createSolanaRpc(rpcUrl);
            const kitAddr = address(addr);
            const [delegations, delegationsReceived] = await Promise.all([
                fetchDelegationsByDelegator(rpc, kitAddr),
                fetchDelegationsByDelegatee(rpc, kitAddr),
            ]);
            return { delegations, delegationsReceived };
        },
        { suspense: true },
    );
}

export function useWalletPlans(walletAddress: string | null) {
    const { cluster, url } = useCluster();

    return useSWRImmutable(
        walletAddress !== null && ENABLED_CLUSTERS.has(cluster)
            ? (['wallet-plans', walletAddress, url] as const)
            : undefined,
        async ([_prefix, addr, rpcUrl]) => {
            const rpc = createSolanaRpc(rpcUrl);
            const kitAddr = address(addr);
            const plans = await fetchPlansForOwner(rpc, kitAddr);
            return { plans };
        },
        { suspense: true },
    );
}
