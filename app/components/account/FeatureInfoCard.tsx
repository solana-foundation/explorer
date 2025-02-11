'use client'

import { AccountAddressRow, AccountBalanceRow, AccountHeader } from '@components/common/Account';
import { Address } from '@components/common/Address';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account, useFetchAccountInfo } from '@providers/accounts';
import { NonceAccount } from '@validators/accounts/nonce';
import React from 'react';

import { UpcomingFeatures } from '@/app/utils/feature-gate/featureGate';
import FEATURES from '@/app/utils/feature-gate/featureGates.json';
import { FeatureInfoCard as FeatureInfo } from '@/app/utils/feature-gate/FeatureInfoCard';
import {FeatureInfoType} from '@/app/utils/feature-gate/types';

export function FeatureInfoCard({ address }: { address: string }) {
    console.log({ address })


    return <FeatureInfo feature={FEATURES[0] as FeatureInfoType} />

    return (
        <div className="card">
            <div className="card-header align-items-center">
                <h3 className="card-header-title">Owned Domain Names</h3>
            </div>
            <div className="table-responsive mb-0">
                <table className="table table-sm table-nowrap card-table">
                    <thead>
                        <tr>
                            <th className="text-muted">Domain Name</th>
                            <th className="text-muted">Name Service Account</th>
                        </tr>
                    </thead>
                    <tbody className="list">
                        info
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export function _FeatureInfoSection({ account, nonceAccount }: { account: Account; nonceAccount: NonceAccount }) {
    const refresh = useFetchAccountInfo();
    return (
        <div className="card">
            <AccountHeader title="Nonce Account" refresh={() => refresh(account.pubkey, 'parsed')} />

            <TableCardBody>
                <AccountAddressRow account={account} />
                <AccountBalanceRow account={account} />

                <tr>
                    <td>Authority</td>
                    <td className="text-lg-end">
                        <Address pubkey={nonceAccount.info.authority} alignRight raw link />
                    </td>
                </tr>

                <tr>
                    <td>Blockhash</td>
                    <td className="text-lg-end">
                        <code>{nonceAccount.info.blockhash}</code>
                    </td>
                </tr>

                <tr>
                    <td>Fee</td>
                    <td className="text-lg-end">
                        {nonceAccount.info.feeCalculator.lamportsPerSignature} lamports per signature
                    </td>
                </tr>
            </TableCardBody>
        </div>
    );
}
