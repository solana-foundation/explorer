import { Slot } from '@components/common/Slot';
import { SlotHashEntry, SlotHashesInfo, SysvarAccount } from '@validators/accounts/sysvar';
import React from 'react';

import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';

export function SlotHashesCard({ sysvarAccount }: { sysvarAccount: SysvarAccount }) {
    const slotHashes = sysvarAccount.info as SlotHashesInfo;
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Slot Hashes
                </CardTitle>
            </CardHeader>

            {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
            <div className="table-responsive e-mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="w-1 text-muted">Slot</th>
                            <th className="text-muted">Hash</th>
                        </tr>
                    </thead>
                    <tbody className="list">
                        {slotHashes.length > 0 &&
                            slotHashes.map((entry: SlotHashEntry, index) => {
                                return renderAccountRow(entry, index);
                            })}
                    </tbody>
                </table>
            </div>

            <CardFooter ui="dashkit">
                <div className="e-text-center e-text-dk-gray-700">{slotHashes.length > 0 ? '' : 'No hashes found'}</div>
            </CardFooter>
        </Card>
    );
}

const renderAccountRow = (entry: SlotHashEntry, index: number) => {
    return (
        <tr key={index}>
            <td className="w-1 font-monospace">
                <Slot slot={entry.slot} link />
            </td>
            <td className="font-monospace">{entry.hash}</td>
        </tr>
    );
};
