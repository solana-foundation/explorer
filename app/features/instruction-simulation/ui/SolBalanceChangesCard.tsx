import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { SolBalance } from '@components/common/SolBalance';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';

import type { SolBalanceChange } from '../lib/types';

export function SolBalanceChangesCard({ balanceChanges }: { balanceChanges: SolBalanceChange[] }) {
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    SOL Balance Changes
                </CardTitle>
            </CardHeader>
            <div className="e-mb-0 e-overflow-x-auto">
                {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="e-text-dk-gray-700">#</th>
                            <th className="e-text-dk-gray-700">Address</th>
                            <th className="e-text-dk-gray-700">Change (SOL)</th>
                            <th className="e-text-dk-gray-700">Post Balance (SOL)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {balanceChanges.map((change, i) => (
                            <tr key={change.pubkey.toBase58()}>
                                <td>
                                    <span className="badge bg-info-soft e-mr-[3px]">{i + 1}</span>
                                </td>
                                <td>
                                    <Address pubkey={change.pubkey} link fetchTokenLabelInfo />
                                </td>
                                <td>
                                    <BalanceDelta delta={change.delta} isSol />
                                </td>
                                <td>
                                    <SolBalance lamports={BigInt(change.postBalance.toString())} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
}
