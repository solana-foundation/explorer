import { Epoch } from '@components/common/Epoch';
import { SolBalance } from '@components/common/SolBalance';
import type { StakeHistoryEntry, SysvarStakeHistoryAccount } from '@validators/accounts/sysvar';
import React from 'react';

import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';

export function StakeHistoryCard({ sysvarAccount }: { sysvarAccount: SysvarStakeHistoryAccount }) {
    const stakeHistory = sysvarAccount.info;
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Stake History
                </CardTitle>
            </CardHeader>

            {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
            <div className="table-responsive e-mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="e-w-px e-text-dk-gray-700">Epoch</th>
                            <th className="e-text-dk-gray-700">Effective (SOL)</th>
                            <th className="e-text-dk-gray-700">Activating (SOL)</th>
                            <th className="e-text-dk-gray-700">Deactivating (SOL)</th>
                        </tr>
                    </thead>
                    <tbody className="list">
                        {stakeHistory.map(entry => (
                            <HistoryEntryRow key={entry.epoch} entry={entry} />
                        ))}
                    </tbody>
                </table>
            </div>

            {stakeHistory.length === 0 && (
                <CardFooter ui="dashkit">
                    <div className="e-text-center e-text-dk-gray-700">No stake history found</div>
                </CardFooter>
            )}
        </Card>
    );
}

function HistoryEntryRow({ entry }: { entry: StakeHistoryEntry }) {
    return (
        <tr>
            <td className="e-w-px e-font-mono">
                <Epoch epoch={entry.epoch} link />
            </td>
            <td className="e-font-mono">
                <SolBalance lamports={entry.stakeHistory.effective} />
            </td>
            <td className="e-font-mono">
                <SolBalance lamports={entry.stakeHistory.activating} />
            </td>
            <td className="e-font-mono">
                <SolBalance lamports={entry.stakeHistory.deactivating} />
            </td>
        </tr>
    );
}
