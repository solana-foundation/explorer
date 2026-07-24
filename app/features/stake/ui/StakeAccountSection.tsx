import { Epoch } from '@components/common/Epoch';
import { KitAddress } from '@components/common/KitAddress';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { useRefreshAccount } from '@entities/account';
import { formatUsdValue, PriceStatus, useTokenPrice } from '@entities/token-price';
import { AccountCard } from '@features/account';
import type { Account } from '@providers/accounts';
import { NATIVE_MINT } from '@solana/spl-token';
import { PublicKey } from '@solana/web3.js';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import { capitalizeFirstLetter, lamportsToSol } from '@utils/index';
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

const STAKE_TYPE_LABELS: Record<StakeAccountType, string> = {
    delegated: 'Delegated',
    initialized: 'Initialized',
    rewardsPool: 'Rewards Pool',
    uninitialized: 'Uninitialized',
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
    // Price is only fetched on Mainnet Beta (the hook returns undefined elsewhere), so USD values
    // simply don't render on other clusters.
    const priceResult = useTokenPrice(NATIVE_MINT.toBase58());
    const solPrice = priceResult?.status === PriceStatus.Success ? priceResult.price : null;
    return (
        <>
            <LockupCard stakeAccount={stakeAccount} />
            <OverviewCard
                account={account}
                stakeAccount={stakeAccount}
                stakeAccountType={stakeAccountType}
                activation={activation}
                solPrice={solPrice}
            />
            {stakeAccount.stake && (
                <DelegationCard stakeAccount={stakeAccount} activation={activation} solPrice={solPrice} />
            )}
            <AuthoritiesCard meta={stakeAccount.meta} />
        </>
    );
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

// Renders a SOL balance and, when a price is available, its USD value alongside it.
function SolWithUsd({ lamports, solPrice }: { lamports: number | bigint; solPrice: number | null }) {
    const usd = solPrice != null ? formatUsdValue(lamportsToSol(lamports), solPrice) : null;
    return (
        <>
            <SolBalance lamports={lamports} />
            {usd && <span className="ml-2 text-dk-gray-700">({usd})</span>}
        </>
    );
}

function OverviewCard({
    account,
    stakeAccount,
    stakeAccountType,
    activation,
    solPrice,
}: {
    account: Account;
    stakeAccount: StakeAccountInfo;
    stakeAccountType: StakeAccountType;
    activation?: StakeActivationData;
    solPrice: number | null;
}) {
    const refresh = useRefreshAccount();
    const totalValueUsd = solPrice != null ? formatUsdValue(lamportsToSol(account.lamports), solPrice) : null;
    // Only delegated accounts carry a live activation state; other types are fully described by Type.
    const state = stakeAccountType === 'delegated' && activation ? capitalizeFirstLetter(activation.state) : undefined;
    const isOnCurve = PublicKey.isOnCurve(account.pubkey.toBytes());
    return (
        <AccountCard
            title="Overview"
            account={account}
            analyticsSection="stake_account_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            {totalValueUsd && (
                <BaseTable.Row>
                    <BaseTable.Cell>Total Value</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">{totalValueUsd}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="md:text-right">
                    <KitAddress address={toKitAddress(account.pubkey)} alignRight raw />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="uppercase md:text-right">
                    <SolWithUsd lamports={account.lamports} solPrice={solPrice} />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Type</BaseTable.Cell>
                <BaseTable.Cell className="md:text-right">{STAKE_TYPE_LABELS[stakeAccountType]}</BaseTable.Cell>
            </BaseTable.Row>
            {state !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>State</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">{state}</BaseTable.Cell>
                </BaseTable.Row>
            )}
            <BaseTable.Row>
                <BaseTable.Cell>Rent Reserve (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="md:text-right">
                    <SolBalance lamports={stakeAccount.meta.rentExemptReserve} />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Is On Curve</BaseTable.Cell>
                <BaseTable.Cell className="md:text-right">{isOnCurve ? 'Yes' : 'No'}</BaseTable.Cell>
            </BaseTable.Row>
            {account.space !== undefined && (
                <BaseTable.Row>
                    <BaseTable.Cell>Allocated Data Size</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">{account.space} byte(s)</BaseTable.Cell>
                </BaseTable.Row>
            )}
        </AccountCard>
    );
}

function DelegationCard({
    stakeAccount,
    activation,
    solPrice,
}: {
    stakeAccount: StakeAccountInfo;
    activation?: StakeActivationData;
    solPrice: number | null;
}) {
    const { stake } = stakeAccount;
    if (!stake) {
        return null;
    }
    const { delegation } = stake;
    const activationEpoch = delegation.activationEpoch !== EPOCH_NEVER_SET ? delegation.activationEpoch : undefined;
    const deactivationEpoch =
        delegation.deactivationEpoch !== EPOCH_NEVER_SET ? delegation.deactivationEpoch : undefined;
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit" className="flex items-center">
                    Stake Delegation
                </CardTitle>
            </CardHeader>
            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Delegated Stake (SOL)</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">
                        <SolWithUsd lamports={delegation.stake} solPrice={solPrice} />
                    </BaseTable.Cell>
                </BaseTable.Row>

                {activation && (
                    <>
                        <BaseTable.Row>
                            <BaseTable.Cell>Active Stake (SOL)</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                <SolWithUsd lamports={activation.active} solPrice={solPrice} />
                            </BaseTable.Cell>
                        </BaseTable.Row>

                        <BaseTable.Row>
                            <BaseTable.Cell>Inactive Stake (SOL)</BaseTable.Cell>
                            <BaseTable.Cell className="md:text-right">
                                <SolWithUsd lamports={activation.inactive} solPrice={solPrice} />
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    </>
                )}

                <BaseTable.Row>
                    <BaseTable.Cell>Delegated Vote Address</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">
                        <KitAddress address={delegation.voter} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>

                <BaseTable.Row>
                    <BaseTable.Cell>Activation Epoch</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">
                        {activationEpoch !== undefined ? <Epoch epoch={activationEpoch} link /> : '-'}
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Deactivation Epoch</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">
                        {deactivationEpoch !== undefined ? <Epoch epoch={deactivationEpoch} link /> : '-'}
                    </BaseTable.Cell>
                </BaseTable.Row>
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
                    <BaseTable.Cell className="md:text-right">
                        <KitAddress address={meta.authorized.staker} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>

                <BaseTable.Row>
                    <BaseTable.Cell>Withdraw Authority Address</BaseTable.Cell>
                    <BaseTable.Cell className="md:text-right">
                        <KitAddress address={meta.authorized.withdrawer} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>

                {hasLockup && (
                    <BaseTable.Row>
                        <BaseTable.Cell>Lockup Authority Address</BaseTable.Cell>
                        <BaseTable.Cell className="md:text-right">
                            <KitAddress address={meta.lockup.custodian} alignRight link />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                )}
            </TableCardBody>
        </Card>
    );
}
