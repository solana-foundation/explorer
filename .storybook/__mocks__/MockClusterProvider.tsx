// Skip ClusterProvider's mount-time RPC (getFirstAvailableBlock/Schedule/Info, getGenesisHash).

import { type ClusterState, DispatchContext, StateContext } from '@providers/cluster';
import { Cluster, ClusterStatus, MAINNET_BETA_URL } from '@utils/cluster';
import { type ReactNode, useState } from 'react';

const defaultState: ClusterState = {
    cluster: Cluster.MainnetBeta,
    clusterInfo: {
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
        genesisHash: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2N9d',
    },
    customUrl: MAINNET_BETA_URL,
    status: ClusterStatus.Connected,
};

type Props = {
    children: ReactNode;
    state?: ClusterState;
};

export function MockClusterProvider({ children, state = defaultState }: Props) {
    // Wire a real reducer state slot so any dispatch from consumers is harmless.
    const [current, setCurrent] = useState<ClusterState>(state);
    return (
        <StateContext.Provider value={current}>
            <DispatchContext.Provider value={setCurrent as any}>{children}</DispatchContext.Provider>
        </StateContext.Provider>
    );
}
