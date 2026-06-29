import { useCluster } from '@providers/cluster';
import { createSolanaRpc } from '@solana/kit';
import { Cluster } from '@utils/cluster';
import { type Dispatch, type SetStateAction, useState } from 'react';

import { Logger } from '@/app/shared/lib/logger';

type VoteAccountInfo = Readonly<{
    activatedStake: bigint;
}>;

type VoteAccounts = Readonly<{
    current: VoteAccountInfo[];
    delinquent: VoteAccountInfo[];
}>;

export function useVoteAccounts() {
    const [voteAccounts, setVoteAccounts] = useState<VoteAccounts>();
    const { cluster, url } = useCluster();

    return {
        fetchVoteAccounts: () => fetchVoteAccounts({ cluster, setVoteAccounts, url }),
        voteAccounts,
    };
}

async function fetchVoteAccounts({
    cluster,
    setVoteAccounts,
    url,
}: {
    cluster: Cluster;
    setVoteAccounts: Dispatch<SetStateAction<VoteAccounts | undefined>>;
    url: string;
}) {
    try {
        const rpc = createSolanaRpc(url);

        const voteAccountsResponse = await rpc.getVoteAccounts({ commitment: 'confirmed' }).send();
        const voteAccounts: VoteAccounts = {
            current: voteAccountsResponse.current.map(c => ({ activatedStake: c.activatedStake })),
            delinquent: voteAccountsResponse.delinquent.map(d => ({ activatedStake: d.activatedStake })),
        };

        setVoteAccounts(voteAccounts);
    } catch (error) {
        if (cluster !== Cluster.Custom) {
            Logger.error(error, { url });
        }
    }
}
