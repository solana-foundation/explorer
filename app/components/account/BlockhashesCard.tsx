import { RecentBlockhashesEntry, RecentBlockhashesInfo } from '@validators/accounts/sysvar';
import React from 'react';

import { CardFooter, CardHeader } from '@/app/shared/ui/Card';

export function BlockhashesCard({ blockhashes }: { blockhashes: RecentBlockhashesInfo }) {
    return (
        <>
            <div className="card">
                <CardHeader ui="dashkit">
                    <div className="row e-items-center">
                        <div className="col">
                            <h3 className="card-header-title">Blockhashes</h3>
                        </div>
                    </div>
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
                    <div className="text-muted text-center">{blockhashes.length > 0 ? '' : 'No blockhashes found'}</div>
                </CardFooter>
            </div>
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
