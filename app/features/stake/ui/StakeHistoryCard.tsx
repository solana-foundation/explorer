import { Epoch } from '@components/common/Epoch';
import { SolBalance } from '@components/common/SolBalance';
import type { StakeHistoryEntry, SysvarStakeHistoryAccount } from '@validators/accounts/sysvar';
import React from 'react';

import { CardFooter, CardHeader } from '@/app/shared/ui/Card';

export function StakeHistoryCard({ sysvarAccount }: { sysvarAccount: SysvarStakeHistoryAccount }) {
    const stakeHistory = sysvarAccount.info;
    return (
        <div className="card">
            <CardHeader ui="dashkit">
                <div className="row e-items-center">
                    <div className="col">
                        <h3 className="card-header-title">Stake History</h3>
                    </div>
                </div>
            </CardHeader>

            {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
            <div className="table-responsive e-mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="w-1 text-muted">Epoch</th>
                            <th className="text-muted">Effective (SOL)</th>
                            <th className="text-muted">Activating (SOL)</th>
                            <th className="text-muted">Deactivating (SOL)</th>
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
                    <div className="text-muted e-text-center">No stake history found</div>
                </CardFooter>
            )}
        </div>
    );
}

function HistoryEntryRow({ entry }: { entry: StakeHistoryEntry }) {
    return (
        <tr>
            <td className="w-1 font-monospace">
                <Epoch epoch={entry.epoch} link />
            </td>
            <td className="font-monospace">
                <SolBalance lamports={entry.stakeHistory.effective} />
            </td>
            <td className="font-monospace">
                <SolBalance lamports={entry.stakeHistory.activating} />
            </td>
            <td className="font-monospace">
                <SolBalance lamports={entry.stakeHistory.deactivating} />
            </td>
        </tr>
    );
}
