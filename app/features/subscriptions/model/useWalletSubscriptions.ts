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

type HookOptions = {
    /**
     * When `true` (default), errors are thrown to the nearest ErrorBoundary — suitable
     * for the dedicated subscriptions page. Callers that render on every account page
     * (e.g. the tab-visibility check) should pass `false` and guard on `error`, so a
     * failing RPC hides the tab instead of taking down the whole account page.
     */
    suspense?: boolean;
};

export function useWalletDelegations(walletAddress: string | null, options?: HookOptions) {
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
        { suspense: options?.suspense ?? true },
    );
}

export function useWalletPlans(walletAddress: string | null, options?: HookOptions) {
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
        { suspense: options?.suspense ?? true },
    );
}
