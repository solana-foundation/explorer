'use client';

import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { AdjacentClusterLink, SearchingClusterIndicator, useClusterResourceSearch } from '@entities/cluster';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { address as createAddress, createSolanaRpc } from '@solana/kit';
import { addressLabel } from '@utils/tx';

import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';

export function UnknownAccountCard({ account }: { account: Account }) {
    const { cluster } = useCluster();

    const label = addressLabel(account.pubkey.toBase58(), cluster);
    const rows: KeyValueRow[] = [
        { label: 'Address', value: <Address pubkey={account.pubkey} raw /> },
        { label: 'Address Label', show: Boolean(label), value: label },
        {
            label: 'Balance (SOL)',
            value:
                account.lamports === 0 ? (
                    <AccountNofFound account={account} />
                ) : (
                    <SolBalance lamports={account.lamports} />
                ),
        },
        {
            label: 'Allocated Data Size',
            show: account.space !== undefined,
            value: account.space !== undefined && `${account.space} byte(s)`,
        },
        { label: 'Assigned Program Id', value: <Address pubkey={account.owner} link /> },
        { label: 'Executable', value: account.executable ? 'Yes' : 'No' },
    ];

    return (
        <AccountCard title="Overview" account={account}>
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}

const LABELS = {
    'not-found': 'Account does not exist',
};

function AccountNofFound({ account, labels = LABELS }: { account: Account; labels?: typeof LABELS }) {
    const { cluster } = useCluster();
    const address = account.pubkey.toBase58();
    const { status, searchingCluster, foundCluster } = useClusterResourceSearch({
        currentCluster: cluster,
        probe: probeAccount,
        resourceId: address,
    });

    if (status === 'searching' && searchingCluster !== undefined) {
        return (
            <span>
                <SearchingClusterIndicator searchingCluster={searchingCluster} />
                <span className="align-middle">{labels['not-found']}</span>
            </span>
        );
    }

    if (status === 'found' && foundCluster !== undefined) {
        return (
            <span>
                <AdjacentClusterLink foundCluster={foundCluster} pathname={`/address/${address}`} />
                <span className="align-middle">{labels['not-found']}</span>
            </span>
        );
    }

    return <span>{labels['not-found']}</span>;
}

async function probeAccount(url: string, address: string): Promise<boolean> {
    const rpc = createSolanaRpc(url);
    const { value } = await rpc.getAccountInfo(createAddress(address), { encoding: 'base64' }).send();

    // RPC returns literal null when the account does not exist on that cluster
    return value !== null;
}
