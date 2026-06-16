import { Slot } from '@components/common/Slot';
import { SlotHashEntry, SlotHashesInfo, SysvarAccount } from '@validators/accounts/sysvar';
import React from 'react';

import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

export function SlotHashesCard({ sysvarAccount }: { sysvarAccount: SysvarAccount }) {
    const slotHashes = sysvarAccount.info as SlotHashesInfo;
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Slot Hashes
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="w-px text-dk-gray-700">Slot</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="text-dk-gray-700">Hash</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>
                    {slotHashes.length > 0 &&
                        slotHashes.map((entry: SlotHashEntry, index) => {
                            return renderAccountRow(entry, index);
                        })}
                </BaseTable.Body>
            </BaseTable>

            <CardFooter ui="dashkit">
                <div className="text-center text-dk-gray-700">{slotHashes.length > 0 ? '' : 'No hashes found'}</div>
            </CardFooter>
        </Card>
    );
}

const renderAccountRow = (entry: SlotHashEntry, index: number) => {
    return (
        <BaseTable.Row key={index}>
            <BaseTable.Cell className="w-px font-mono">
                <Slot slot={entry.slot} link />
            </BaseTable.Cell>
            <BaseTable.Cell className="font-mono">{entry.hash}</BaseTable.Cell>
        </BaseTable.Row>
    );
};
