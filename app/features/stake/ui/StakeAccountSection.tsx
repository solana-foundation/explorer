import { Epoch } from '@components/common/Epoch';
import { KitAddress } from '@components/common/KitAddress';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import type { Account } from '@providers/accounts';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import React from 'react';

import { toKitAddress } from '@/app/shared/lib/web3js-compat';
import { Alert } from '@/app/shared/ui/Alert';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import type { StakeActivationStatus } from '../api/stake-activation';
import { EPOCH_NEVER_SET } from '../lib/constants';
import type { StakeAccountInfo, StakeAccountType, StakeMeta } from '../lib/validators';

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
        <Alert variant="warning" className="text-center">
            <strong>Account is locked!</strong> Lockup expires on {displayTimestampUtc(lockupExpiryMs)}
        </Alert>
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
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <KitAddress address={toKitAddress(account.pubkey)} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="text-right uppercase">
                    <SolBalance lamports={account.lamports} />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Rent Reserve (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <SolBalance lamports={stakeAccount.meta.rentExemptReserve} />
                </BaseTable.Cell>
            </BaseTable.Row>
            {status !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Status</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">{status}</BaseTable.Cell>
                </BaseTable.Row>
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
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="flex items-center">
                    Stake Delegation
                </CardTitle>
            </CardHeader>
            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Status</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        {activation ? `Delegated (${activation.state})` : 'Delegated'}
                    </BaseTable.Cell>
                </BaseTable.Row>

                {stake && (
                    <>
                        <BaseTable.Row>
                            <BaseTable.Cell>Delegated Stake (SOL)</BaseTable.Cell>
                            <BaseTable.Cell className="text-right">
                                <SolBalance lamports={stake.delegation.stake} />
                            </BaseTable.Cell>
                        </BaseTable.Row>

                        {activation && (
                            <>
                                <BaseTable.Row>
                                    <BaseTable.Cell>Active Stake (SOL)</BaseTable.Cell>
                                    <BaseTable.Cell className="text-right">
                                        <SolBalance lamports={activation.active} />
                                    </BaseTable.Cell>
                                </BaseTable.Row>

                                <BaseTable.Row>
                                    <BaseTable.Cell>Inactive Stake (SOL)</BaseTable.Cell>
                                    <BaseTable.Cell className="text-right">
                                        <SolBalance lamports={activation.inactive} />
                                    </BaseTable.Cell>
                                </BaseTable.Row>
                            </>
                        )}

                        {voterPubkey && (
                            <BaseTable.Row>
                                <BaseTable.Cell>Delegated Vote Address</BaseTable.Cell>
                                <BaseTable.Cell className="text-right">
                                    <KitAddress address={voterPubkey} alignRight link />
                                </BaseTable.Cell>
                            </BaseTable.Row>
                        )}

                        <BaseTable.Row>
                            <BaseTable.Cell>Activation Epoch</BaseTable.Cell>
                            <BaseTable.Cell className="text-right">
                                {activationEpoch !== undefined ? <Epoch epoch={activationEpoch} link /> : '-'}
                            </BaseTable.Cell>
                        </BaseTable.Row>
                        <BaseTable.Row>
                            <BaseTable.Cell>Deactivation Epoch</BaseTable.Cell>
                            <BaseTable.Cell className="text-right">
                                {deactivationEpoch !== undefined ? <Epoch epoch={deactivationEpoch} link /> : '-'}
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    </>
                )}
            </TableCardBody>
        </Card>
    );
}

function AuthoritiesCard({ meta }: { meta: StakeMeta }) {
    const hasLockup = meta.lockup.unixTimestamp > 0;
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="flex items-center">
                    Authorities
                </CardTitle>
            </CardHeader>
            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Stake Authority Address</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <KitAddress address={meta.authorized.staker} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>

                <BaseTable.Row>
                    <BaseTable.Cell>Withdraw Authority Address</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <KitAddress address={meta.authorized.withdrawer} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>

                {hasLockup && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Lockup Authority Address</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">
                            <KitAddress address={meta.lockup.custodian} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                )}
            </TableCardBody>
        </Card>
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
