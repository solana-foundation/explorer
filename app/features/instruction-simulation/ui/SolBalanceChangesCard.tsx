import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { SolBalance } from '@components/common/SolBalance';

import { Badge } from '@/app/components/shared/ui/badge';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import type { SolBalanceChange } from '../lib/types';

export function SolBalanceChangesCard({ balanceChanges }: { balanceChanges: SolBalanceChange[] }) {
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    SOL Balance Changes
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="text-dk-gray-700">#</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Address</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Change (SOL)</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Post Balance (SOL)</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>
                    {balanceChanges.map((change, i) => (
                        <BaseTable.Row key={change.pubkey.toBase58()}>
                            <BaseTable.Cell>
                                <Badge ui="dashkit" variant="info" className="mr-[3px]">
                                    {i + 1}
                                </Badge>
                            </BaseTable.Cell>
                            <BaseTable.Cell>
                                <Address pubkey={change.pubkey} link fetchTokenLabelInfo />
                            </BaseTable.Cell>
                            <BaseTable.Cell>
                                <BalanceDelta delta={change.delta} isSol />
                            </BaseTable.Cell>
                            <BaseTable.Cell>
                                <SolBalance lamports={BigInt(change.postBalance.toString())} />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    ))}
                </BaseTable.Body>
            </BaseTable>
        </Card>
    );
}
