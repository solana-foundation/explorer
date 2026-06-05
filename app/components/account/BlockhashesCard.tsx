import { RecentBlockhashesEntry, RecentBlockhashesInfo } from '@validators/accounts/sysvar';
import React from 'react';

import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';

export function BlockhashesCard({ blockhashes }: { blockhashes: RecentBlockhashesInfo }) {
    return (
        <>
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit">
                        Blockhashes
                    </CardTitle>
                </CardHeader>

                {/* TODO: migrate to <BaseCardTable> from @/app/shared/ui/Table */}
                <div className="table-responsive e-mb-0">
                    <table className="table table-sm table-nowrap card-table">
                        <thead>
                            <tr>
                                <th className="w-1 text-muted">Recency</th>
                                <th className="w-1 text-muted">Blockhash</th>
                                <th className="text-muted">Fee Calculator</th>
                            </tr>
                        </thead>
                        <tbody className="list">
                            {blockhashes.length > 0 &&
                                blockhashes.map((entry: RecentBlockhashesEntry, index) => {
                                    return renderAccountRow(entry, index);
                                })}
                        </tbody>
                    </table>
                </div>

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
        <tr key={index}>
            <td className="w-1">{index + 1}</td>
            <td className="w-1 font-monospace">{entry.blockhash}</td>
            <td className="">{entry.feeCalculator.lamportsPerSignature} lamports per signature</td>
        </tr>
    );
};
