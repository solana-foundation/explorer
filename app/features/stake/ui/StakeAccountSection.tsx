import { Address } from '@components/common/Address';
import { Epoch } from '@components/common/Epoch';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import type { Account } from '@providers/accounts';
import { displayTimestampUtc } from '@utils/date';
import React from 'react';

import type { StakeActivationStatus } from '../api/stake-activation';
import type { StakeAccountInfo, StakeAccountType, StakeMeta } from '../lib/validators';

type StakeActivationData = {
    state: StakeActivationStatus;
    active: number;
    inactive: number;
};

// Sentinel u64::MAX used on chain for activation/deactivation epochs that have never been set.
const EPOCH_NEVER_SET = 0xffffffffffffffffn;

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
    const hideDelegation = stakeAccountType !== 'delegated' || isFullyInactivated(stakeAccount, activation);
    return (
        <>
            <LockupCard stakeAccount={stakeAccount} />
            <OverviewCard account={account} stakeAccount={stakeAccount} hideDelegation={hideDelegation} />
            {!hideDelegation && <DelegationCard stakeAccount={stakeAccount} activation={activation} />}
            <AuthoritiesCard meta={stakeAccount.meta} />
        </>
    );
}

function LockupCard({ stakeAccount }: { stakeAccount: StakeAccountInfo }) {
    const unixTimestamp = 1000 * stakeAccount.meta.lockup.unixTimestamp;
    if (Date.now() >= unixTimestamp) {
        return null;
    }
    return (
        <div className="alert alert-warning text-center">
            <strong>Account is locked!</strong> Lockup expires on {displayTimestampUtc(unixTimestamp)}
        </div>
    );
}

function OverviewCard({
    account,
    stakeAccount,
    hideDelegation,
}: {
    account: Account;
    stakeAccount: StakeAccountInfo;
    hideDelegation: boolean;
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
                    <Address pubkey={account.pubkey} alignRight raw />
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
            {hideDelegation && (
                <tr>
                    <td>Status</td>
                    <td className="text-lg-end">Not delegated</td>
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
    const delegation = stakeAccount?.stake?.delegation;
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
            <div className="card-header">
                <h3 className="card-header-title mb-0 d-flex align-items-center">Stake Delegation</h3>
            </div>
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
                                    <Address pubkey={voterPubkey} alignRight link />
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
            <div className="card-header">
                <h3 className="card-header-title mb-0 d-flex align-items-center">Authorities</h3>
            </div>
            <TableCardBody>
                <tr>
                    <td>Stake Authority Address</td>
                    <td className="text-lg-end">
                        <Address pubkey={meta.authorized.staker} alignRight link />
                    </td>
                </tr>

                <tr>
                    <td>Withdraw Authority Address</td>
                    <td className="text-lg-end">
                        <Address pubkey={meta.authorized.withdrawer} alignRight link />
                    </td>
                </tr>

                {hasLockup && (
                    <tr>
                        <td>Lockup Authority Address</td>
                        <td className="text-lg-end">
                            <Address pubkey={meta.lockup.custodian} alignRight link />
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
