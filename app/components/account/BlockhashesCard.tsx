import { RecentBlockhashesEntry, RecentBlockhashesInfo } from '@validators/accounts/sysvar';
import React from 'react';

import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

export function BlockhashesCard({ blockhashes }: { blockhashes: RecentBlockhashesInfo }) {
    return (
        <>
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit">
                        Blockhashes
                    </CardTitle>
                </CardHeader>
                <BaseTable ui="dashkit" variant="card" nowrap>
                    <BaseTable.Head>
                        <BaseTable.Row>
                            <BaseTable.HeaderCell className="text-muted e-w-px">Recency</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="text-muted e-w-px">Blockhash</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="text-muted">Fee Calculator</BaseTable.HeaderCell>
                        </BaseTable.Row>
                    </BaseTable.Head>
                    <BaseTable.Body className="list">
                        {blockhashes.length > 0 &&
                            blockhashes.map((entry: RecentBlockhashesEntry, index) => {
                                return renderAccountRow(entry, index);
                            })}
                    </BaseTable.Body>
                </BaseTable>

                <CardFooter ui="dashkit">
                    <div className="e-text-center e-text-dk-gray-700">
                        {blockhashes.length > 0 ? '' : 'No blockhashes found'}
                    </div>
                </CardFooter>
            </Card>
        </>
    );
}

const renderAccountRow = (entry: RecentBlockhashesEntry, index: number) => {
    return (
        <BaseTable.Row key={index}>
            <BaseTable.Cell className="e-w-px">{index + 1}</BaseTable.Cell>
            <BaseTable.Cell className="font-monospace e-w-px">{entry.blockhash}</BaseTable.Cell>
            <BaseTable.Cell className="">
                {entry.feeCalculator.lamportsPerSignature} lamports per signature
            </BaseTable.Cell>
        </BaseTable.Row>
    );
};
