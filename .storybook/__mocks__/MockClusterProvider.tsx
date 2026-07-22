// Skips ClusterProvider's mount-time health check (getGenesisHash) and seeds useClusterInfo()'s
// SWR cache so consumers render epoch/schedule data without any network call.

import { type ClusterInfo, clusterModalOpenAtom, type ClusterState, StateContext } from '@providers/cluster';
import { Cluster, ClusterStatus, clusterUrl, MAINNET_BETA_URL } from '@utils/cluster';
import { useHydrateAtoms } from 'jotai/utils';
import { type ReactNode, useState } from 'react';
import { SWRConfig, unstable_serialize } from 'swr';

const defaultState: ClusterState = {
    cluster: Cluster.MainnetBeta,
    customUrl: MAINNET_BETA_URL,
    genesisHash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
    status: ClusterStatus.Connected,
};

const defaultClusterInfo: ClusterInfo = {
    epochInfo: {
        absoluteSlot: 312_456_789n,
        blockHeight: 295_456_321n,
        epoch: 520n,
        slotIndex: 156_789n,
        slotsInEpoch: 432_000n,
    },
    epochSchedule: {
        firstNormalEpoch: 14n,
        firstNormalSlot: 524_256n,
        slotsPerEpoch: 432_000n,
    },
    firstAvailableBlock: 0n,
};

type Props = {
    children: ReactNode;
    state?: ClusterState;
    /** Seeds useClusterInfo()'s SWR cache. Pass `null` to leave it empty (loading state). */
    clusterInfo?: ClusterInfo | null;
    modalOpen?: boolean;
};

export function MockClusterProvider({
    children,
    state = defaultState,
    clusterInfo = defaultClusterInfo,
    modalOpen = false,
}: Props) {
    const [current] = useState<ClusterState>(state);
    // Seed the modal atom into the ambient jotai store (the story's own store, or the default one).
    useHydrateAtoms([[clusterModalOpenAtom, modalOpen]]);
    const url = clusterUrl(current.cluster, current.customUrl);
    const fallback = clusterInfo ? { [unstable_serialize(['cluster-info', url])]: clusterInfo } : {};
    return (
        <SWRConfig value={{ fallback }}>
            <StateContext.Provider value={current}>{children}</StateContext.Provider>
        </SWRConfig>
    );
}
