import { Address } from '@components/common/Address';
import { BalanceDelta } from '@components/common/BalanceDelta';
import { SolBalance } from '@components/common/SolBalance';
import React from 'react';

import { SolBalanceChange } from '../lib/types';

export function SolBalanceChangesCard({ balanceChanges }: { balanceChanges: SolBalanceChange[] }) {
    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-header-title">SOL Balance Changes</h3>
            </div>
            <div className="e-mb-0 e-overflow-x-auto">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted">#</th>
                            <th className="text-muted">Address</th>
                            <th className="text-muted">Change (SOL)</th>
                            <th className="text-muted">Post Balance (SOL)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {balanceChanges.map((change, i) => (
                            <tr key={change.pubkey.toBase58()}>
                                <td>
                                    <span className="badge bg-info-soft me-1">{i + 1}</span>
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
        </div>
    );
}
