'use client';

import { useCluster } from '@providers/cluster';
import { address, createSolanaRpc } from '@solana/kit';
import {
    type Delegation,
    fetchDelegationsByDelegator,
    fetchPlansForOwner,
    type PlanWithAddress,
} from '@solana/subscriptions';
import { Cluster } from '@utils/cluster';
import useSWRImmutable from 'swr/immutable';

export type WalletSubscriptionsData = {
    delegations: Delegation[];
    plans: PlanWithAddress[];
};

const ENABLED_CLUSTERS = new Set([Cluster.MainnetBeta, Cluster.Devnet, Cluster.Custom]);

export function useWalletSubscriptions(walletAddress: string | null) {
    const { cluster, url } = useCluster();

    return useSWRImmutable(
        walletAddress !== null && ENABLED_CLUSTERS.has(cluster)
            ? (['wallet-subscriptions', walletAddress, url] as const)
            : undefined,
        async ([_prefix, addr, rpcUrl]) => {
            const rpc = createSolanaRpc(rpcUrl);
            const kitAddr = address(addr);
            const [delegations, plans] = await Promise.all([
                fetchDelegationsByDelegator(rpc, kitAddr),
                fetchPlansForOwner(rpc, kitAddr),
            ]);
            return { delegations, plans };
        },
        { suspense: true },
    );
}
