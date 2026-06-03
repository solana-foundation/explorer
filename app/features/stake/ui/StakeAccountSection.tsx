import { Epoch } from '@components/common/Epoch';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import type { Account } from '@providers/accounts';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import React from 'react';

import { toKitAddress } from '@/app/shared/lib/web3js-compat';
import { CardHeader } from '@/app/shared/ui/Card';

import type { StakeActivationStatus } from '../api/stake-activation';
import { EPOCH_NEVER_SET } from '../lib/constants';
import type { StakeAccountInfo, StakeAccountType, StakeMeta } from '../lib/validators';
import { KitAddress } from './KitAddress';

type StakeActivationData = {
    state: StakeActivationStatus;
    active: number;
    inactive: number;
};

export function StakeAccountSection({
    account,
    stakeAccount,
    activation,
    stakeAccountType,
}: {
    account: Account;
    stakeAccount: StakeAccountInfo;
    stakeAccountType: StakeAccountType;
    activation?: StakeActivationData;
}) {
    const overviewStatus = deriveOverviewStatus(stakeAccountType, stakeAccount, activation);
    return (
        <>
            <LockupCard stakeAccount={stakeAccount} />
            <OverviewCard account={account} stakeAccount={stakeAccount} status={overviewStatus} />
            {overviewStatus === undefined && <DelegationCard stakeAccount={stakeAccount} activation={activation} />}
            <AuthoritiesCard meta={stakeAccount.meta} />
        </>
    );
}

// Returns the Status label to render in the overview card, or undefined when the account is
// actively delegated — in which case the dedicated Stake Delegation card carries the status.
function deriveOverviewStatus(
    stakeAccountType: StakeAccountType,
    stakeAccount: StakeAccountInfo,
    activation?: StakeActivationData,
): string | undefined {
    switch (stakeAccountType) {
        case 'delegated':
            return isFullyInactivated(stakeAccount, activation) ? 'Deactivated' : undefined;
        case 'initialized':
            return 'Initialized';
        case 'uninitialized':
            return 'Uninitialized';
        case 'rewardsPool':
            return 'RewardsPool';
    }
}

function LockupCard({ stakeAccount }: { stakeAccount: StakeAccountInfo }) {
    const lockupExpiryMs = unixTimestampToMs(stakeAccount.meta.lockup.unixTimestamp);
    if (Date.now() >= lockupExpiryMs) {
        return null;
    }
    return (
        <div className="alert alert-warning text-center">
            <strong>Account is locked!</strong> Lockup expires on {displayTimestampUtc(lockupExpiryMs)}
        </div>
    );
}

function OverviewCard({
    account,
    stakeAccount,
    status,
}: {
    account: Account;
    stakeAccount: StakeAccountInfo;
    status?: string;
}) {
    const refresh = useRefreshAccount();
    return (
        <AccountCard
            title="Stake Account"
            account={account}
            analyticsSection="stake_account_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <tr>
                <td>Address</td>
                <td className="text-lg-end">
                    <KitAddress address={toKitAddress(account.pubkey)} alignRight raw />
                </td>
            </tr>
            <tr>
                <td>Balance (SOL)</td>
                <td className="text-lg-end text-uppercase">
                    <SolBalance lamports={account.lamports} />
                </td>
            </tr>
            <tr>
                <td>Rent Reserve (SOL)</td>
                <td className="text-lg-end">
                    <SolBalance lamports={stakeAccount.meta.rentExemptReserve} />
                </td>
            </tr>
            {status !== undefined && (
                <tr>
                    <td>Status</td>
                    <td className="text-lg-end">{status}</td>
                </tr>
            )}
        </AccountCard>
    );
}

function DelegationCard({
    stakeAccount,
    activation,
}: {
    stakeAccount: StakeAccountInfo;
    activation?: StakeActivationData;
}) {
    let voterPubkey, activationEpoch, deactivationEpoch;
    const delegation = stakeAccount.stake?.delegation;
    if (delegation) {
        voterPubkey = delegation.voter;
        if (delegation.activationEpoch !== EPOCH_NEVER_SET) {
            activationEpoch = delegation.activationEpoch;
        }
        if (delegation.deactivationEpoch !== EPOCH_NEVER_SET) {
            deactivationEpoch = delegation.deactivationEpoch;
        }
    }
    const { stake } = stakeAccount;
    return (
        <div className="card">
            <CardHeader ui="dashkit">
                <h3 className="card-header-title e-mb-0 d-flex align-items-center">Stake Delegation</h3>
            </CardHeader>
            <TableCardBody>
                <tr>
                    <td>Status</td>
                    <td className="text-lg-end">{activation ? `Delegated (${activation.state})` : 'Delegated'}</td>
                </tr>

                {stake && (
                    <>
                        <tr>
                            <td>Delegated Stake (SOL)</td>
                            <td className="text-lg-end">
                                <SolBalance lamports={stake.delegation.stake} />
                            </td>
                        </tr>

                        {activation && (
                            <>
                                <tr>
                                    <td>Active Stake (SOL)</td>
                                    <td className="text-lg-end">
                                        <SolBalance lamports={activation.active} />
                                    </td>
                                </tr>

                                <tr>
                                    <td>Inactive Stake (SOL)</td>
                                    <td className="text-lg-end">
                                        <SolBalance lamports={activation.inactive} />
                                    </td>
                                </tr>
                            </>
                        )}

                        {voterPubkey && (
                            <tr>
                                <td>Delegated Vote Address</td>
                                <td className="text-lg-end">
                                    <KitAddress address={voterPubkey} alignRight link />
                                </td>
                            </tr>
                        )}

                        <tr>
                            <td>Activation Epoch</td>
                            <td className="text-lg-end">
                                {activationEpoch !== undefined ? <Epoch epoch={activationEpoch} link /> : '-'}
                            </td>
                        </tr>
                        <tr>
                            <td>Deactivation Epoch</td>
                            <td className="text-lg-end">
                                {deactivationEpoch !== undefined ? <Epoch epoch={deactivationEpoch} link /> : '-'}
                            </td>
                        </tr>
                    </>
                )}
            </TableCardBody>
        </div>
    );
}

function AuthoritiesCard({ meta }: { meta: StakeMeta }) {
    const hasLockup = meta.lockup.unixTimestamp > 0;
    return (
        <div className="card">
            <CardHeader ui="dashkit">
                <h3 className="card-header-title e-mb-0 d-flex align-items-center">Authorities</h3>
            </CardHeader>
            <TableCardBody>
                <tr>
                    <td>Stake Authority Address</td>
                    <td className="text-lg-end">
                        <KitAddress address={meta.authorized.staker} alignRight link />
                    </td>
                </tr>

                <tr>
                    <td>Withdraw Authority Address</td>
                    <td className="text-lg-end">
                        <KitAddress address={meta.authorized.withdrawer} alignRight link />
                    </td>
                </tr>

                {hasLockup && (
                    <tr>
                        <td>Lockup Authority Address</td>
                        <td className="text-lg-end">
                            <KitAddress address={meta.lockup.custodian} alignRight link />
                        </td>
                    </tr>
                )}
            </TableCardBody>
        </div>
    );
}

function isFullyInactivated(stakeAccount: StakeAccountInfo, activation?: StakeActivationData): boolean {
    const { stake } = stakeAccount;

    if (!stake || !activation) {
        return false;
    }

    const delegatedStake = stake.delegation.stake;
    const inactiveStake = BigInt(activation.inactive);

    return stake.delegation.deactivationEpoch !== EPOCH_NEVER_SET && delegatedStake === inactiveStake;
}
