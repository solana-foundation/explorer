import { Epoch } from '@components/common/Epoch';
import { SolBalance } from '@components/common/SolBalance';
import type { StakeHistoryEntry, SysvarStakeHistoryAccount } from '@validators/accounts/sysvar';
import React from 'react';

import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

export function StakeHistoryCard({ sysvarAccount }: { sysvarAccount: SysvarStakeHistoryAccount }) {
    const stakeHistory = sysvarAccount.info;
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Stake History
                </CardTitle>
            </CardHeader>

            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="w-px text-dk-gray-700">Epoch</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Effective (SOL)</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Activating (SOL)</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Deactivating (SOL)</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>
                    {stakeHistory.map(entry => (
                        <HistoryEntryRow key={entry.epoch} entry={entry} />
                    ))}
                </BaseTable.Body>
            </BaseTable>

            {stakeHistory.length === 0 && (
                <CardFooter ui="dashkit">
                    <div className="text-center text-dk-gray-700">No stake history found</div>
                </CardFooter>
            )}
        </Card>
    );
}

function HistoryEntryRow({ entry }: { entry: StakeHistoryEntry }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell className="w-px font-mono">
                <Epoch epoch={entry.epoch} link />
            </BaseTable.Cell>
            <BaseTable.Cell className="font-mono">
                <SolBalance lamports={entry.stakeHistory.effective} />
            </BaseTable.Cell>
            <BaseTable.Cell className="font-mono">
                <SolBalance lamports={entry.stakeHistory.activating} />
            </BaseTable.Cell>
            <BaseTable.Cell className="font-mono">
                <SolBalance lamports={entry.stakeHistory.deactivating} />
            </BaseTable.Cell>
        </BaseTable.Row>
    );
}
