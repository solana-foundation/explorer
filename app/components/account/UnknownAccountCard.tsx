'use client';

import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { AdjacentClusterLink, SearchingClusterIndicator, useClusterResourceSearch } from '@entities/cluster';
import { AccountCard } from '@features/account';
import { Account } from '@providers/accounts';
import { useCluster } from '@providers/cluster';
import { address as createAddress, createSolanaRpc } from '@solana/kit';
import { addressLabel } from '@utils/tx';

import { BaseTable } from '@/app/shared/ui/Table';

export function UnknownAccountCard({ account }: { account: Account }) {
    const { cluster } = useCluster();

    const label = addressLabel(account.pubkey.toBase58(), cluster);
    return (
        <AccountCard title="Overview" account={account}>
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={account.pubkey} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            {label && (
                <BaseTable.Row>
                    <BaseTable.Cell>Address Label</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{label}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    {account.lamports === 0 ? (
                        <AccountNofFound account={account} />
                    ) : (
                        <SolBalance lamports={account.lamports} />
                    )}
                </BaseTable.Cell>
            </BaseTable.Row>

            {account.space !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Allocated Data Size</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{account.space} byte(s)</BaseTable.Cell>
                </BaseTable.Row>
            )}

            <BaseTable.Row>
                <BaseTable.Cell>Assigned Program Id</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={account.owner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Executable</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{account.executable ? 'Yes' : 'No'}</BaseTable.Cell>
            </BaseTable.Row>
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
