import { Epoch } from '@components/common/Epoch';
import { KitAddress } from '@components/common/KitAddress';
import { SolBalance } from '@components/common/SolBalance';
import { useRefreshAccount } from '@entities/account';
import { formatUsdValue, PriceStatus, useTokenPrice } from '@entities/token-price';
import { AccountCard } from '@features/account';
import type { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import { capitalizeFirstLetter, lamportsToSol } from '@utils/index';
import React from 'react';

import { Skeleton } from '@/app/components/shared/ui/skeleton';
import { toKitAddress } from '@/app/shared/lib/web3js-compat';
import { NATIVE_MINT_ADDRESS } from '@/app/shared/model/token-program';
import { Alert } from '@/app/shared/ui/Alert';
import { type KeyValueRowInput, KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

import type { StakeActivationStatus } from '../api/stake-activation';
import { EPOCH_NEVER_SET } from '../lib/constants';
import type { StakeAccountInfo, StakeAccountType, StakeMeta } from '../lib/validators';
import {
    type DisabledTotalRewardState,
    type TotalRewardState,
    TotalRewardStatus,
    useTotalReward,
} from '../model/use-total-reward';

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
    // Price is only fetched on Mainnet (the hook returns undefined elsewhere), so USD values
    // simply don't render on other clusters.
    const priceResult = useTokenPrice(NATIVE_MINT_ADDRESS);
    const solPrice = priceResult?.status === PriceStatus.Success ? priceResult.price : null;
    // Fetched here, alongside the price, so `DelegationCard` stays presentational.
    const totalReward = useTotalReward(toKitAddress(account.pubkey));
    return (
        <>
            <LockupCard stakeAccount={stakeAccount} />
            <StakeOverviewCard
                account={account}
                stakeAccount={stakeAccount}
                stakeAccountType={stakeAccountType}
                activation={activation}
                solPrice={solPrice}
            />
            {stakeAccount.stake && (
                <DelegationCard
                    stakeAccount={stakeAccount}
                    activation={activation}
                    solPrice={solPrice}
                    totalReward={totalReward}
                />
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

function StakeOverviewCard({
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
    const rows: KeyValueRowInput[] = [
        totalValueUsd != null && { label: 'Total Value', value: totalValueUsd },
        { label: 'Address', value: <KitAddress address={toKitAddress(account.pubkey)} raw /> },
        {
            label: 'Balance (SOL)',
            value: <SolWithUsd lamports={account.lamports} solPrice={solPrice} />,
            valueClassName: 'uppercase',
        },
        { label: 'Type', value: STAKE_TYPE_LABELS[stakeAccountType] },
        state !== undefined && { label: 'State', value: state },
        { label: 'Rent Reserve (SOL)', value: <SolBalance lamports={stakeAccount.meta.rentExemptReserve} /> },
        { label: 'Is On Curve', value: isOnCurve ? 'Yes' : 'No' },
        account.space !== undefined && {
            label: 'Allocated Data Size',
            value: `${account.space} byte(s)`,
        },
    ];
    return (
        <AccountCard
            title="Overview"
            account={account}
            analyticsSection="stake_account_section"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <KeyValueRows rows={rows} />
        </AccountCard>
    );
}

/**
 * Exported for Storybook: the card is presentational, so its total-reward states are covered by
 * passing `totalReward` directly rather than by mocking the hook the section calls.
 */
export function DelegationCard({
    stakeAccount,
    activation,
    solPrice,
    totalReward,
}: {
    stakeAccount: StakeAccountInfo;
    activation?: StakeActivationData;
    solPrice: number | null;
    totalReward: TotalRewardState;
}) {
    const { stake } = stakeAccount;
    if (!stake) {
        return null;
    }
    const { delegation } = stake;
    const activationEpoch = delegation.activationEpoch !== EPOCH_NEVER_SET ? delegation.activationEpoch : undefined;
    const deactivationEpoch =
        delegation.deactivationEpoch !== EPOCH_NEVER_SET ? delegation.deactivationEpoch : undefined;
    const rows: KeyValueRowInput[] = [
        {
            label: 'Delegated Stake (SOL)',
            value: <SolWithUsd lamports={delegation.stake} solPrice={solPrice} />,
        },
        activation != null && {
            label: 'Active Stake (SOL)',
            value: <SolWithUsd lamports={activation.active} solPrice={solPrice} />,
        },
        activation != null && {
            label: 'Inactive Stake (SOL)',
            value: <SolWithUsd lamports={activation.inactive} solPrice={solPrice} />,
        },
        totalReward.status !== TotalRewardStatus.Disabled && {
            label: 'Total Reward (SOL)',
            value: <TotalReward state={totalReward} solPrice={solPrice} />,
        },
        { label: 'Delegated Vote Address', value: <KitAddress address={delegation.voter} link /> },
        {
            label: 'Activation Epoch',
            value: activationEpoch !== undefined ? <Epoch epoch={activationEpoch} link /> : '-',
        },
        {
            label: 'Deactivation Epoch',
            value: deactivationEpoch !== undefined ? <Epoch epoch={deactivationEpoch} link /> : '-',
        },
    ];
    return (
        <OverviewCard title="Stake Delegation">
            <KeyValueRows rows={rows} />
        </OverviewCard>
    );
}

// Lifetime rewards load separately from the account, so the row carries its own state. A failure
// shows a quiet message rather than 0 — zero is a claim about the account, not about the request.
// `Disabled` is excluded because the caller drops the whole row, leaving this switch exhaustive.
function TotalReward({
    state,
    solPrice,
}: {
    state: Exclude<TotalRewardState, DisabledTotalRewardState>;
    solPrice: number | null;
}) {
    switch (state.status) {
        case TotalRewardStatus.Loading:
            return <Skeleton className="ml-auto h-4 w-24" />;
        case TotalRewardStatus.Ready:
            return <SolWithUsd lamports={state.lamports} solPrice={solPrice} />;
        // A cluster Solscan does not index and a request that failed read the same to a visitor:
        // the figure is not here. The distinction is ours to act on, not theirs.
        case TotalRewardStatus.Unavailable:
        case TotalRewardStatus.Unsupported:
            return <span className="text-dk-gray-700">Unavailable</span>;
    }
}

function AuthoritiesCard({ meta }: { meta: StakeMeta }) {
    const hasLockup = meta.lockup.unixTimestamp > 0;
    const rows: KeyValueRowInput[] = [
        { label: 'Stake Authority Address', value: <KitAddress address={meta.authorized.staker} link /> },
        { label: 'Withdraw Authority Address', value: <KitAddress address={meta.authorized.withdrawer} link /> },
        hasLockup && {
            label: 'Lockup Authority Address',
            value: <KitAddress address={meta.lockup.custodian} link />,
        },
    ];
    return (
        <OverviewCard title="Authorities">
            <KeyValueRows rows={rows} />
        </OverviewCard>
    );
}
