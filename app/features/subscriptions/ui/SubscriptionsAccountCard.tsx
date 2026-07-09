'use client';

import { KitAddress } from '@components/common/KitAddress';
import { useRefreshAccount } from '@entities/account';
import { AccountCard } from '@features/account';
import type { Account } from '@providers/accounts';
import type { Address } from '@solana/kit';
import type {
    FixedDelegation,
    Plan,
    RecurringDelegation,
    SubscriptionAuthority,
    SubscriptionDelegation,
} from '@solana/subscriptions';
import { PlanStatus } from '@solana/subscriptions';
import { displayTimestampUtc } from '@utils/date';
import { pluralUnits } from '@utils/index';

import { BaseTable } from '@/app/shared/ui/Table';

import { decodeSubscriptionsAccount } from '../lib/decode-subscriptions-account';

function tsToMs(ts: bigint): number {
    return Number(ts * 1000n);
}

function formatExpiry(ts: bigint): string {
    if (ts === 0n) return 'Never';
    return displayTimestampUtc(tsToMs(ts), true);
}

function formatPlanStatus(status: number): string {
    if (status === PlanStatus.Active) return 'Active';
    return `Unknown (${status})`;
}

function ValueRow({ children, label }: { children: React.ReactNode; label: string }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{label}</BaseTable.Cell>
            <BaseTable.Cell className="e-text-right">{children}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

function AddressRow({ address, label }: { address: Address; label: string }) {
    return (
        <ValueRow label={label}>
            <KitAddress address={address} raw link />
        </ValueRow>
    );
}

// Delegator + Delegatee rows shared by all three delegation account types.
type DelegationHeader = { delegatee: Address; delegator: Address; payer: Address };

function DelegationHeaderRows({ header }: { header: DelegationHeader }) {
    return (
        <>
            <AddressRow address={header.delegator} label="Delegator" />
            <AddressRow address={header.delegatee} label="Delegatee" />
        </>
    );
}

export function SubscriptionsAccountCard({ account, onNotFound }: { account?: Account; onNotFound: () => never }) {
    if (!account) return onNotFound();
    const raw = account.data.raw;
    if (!raw) return onNotFound();

    const decoded = decodeSubscriptionsAccount(account.pubkey.toBase58(), raw);
    if (!decoded) return onNotFound();

    switch (decoded.type) {
        case 'Plan':
            return <PlanCard account={account} data={decoded.data} />;
        case 'FixedDelegation':
            return <FixedDelegationCard account={account} data={decoded.data} />;
        case 'RecurringDelegation':
            return <RecurringDelegationCard account={account} data={decoded.data} />;
        case 'SubscriptionDelegation':
            return <SubscriptionDelegationCard account={account} data={decoded.data} />;
        case 'SubscriptionAuthority':
            return <SubscriptionAuthorityCard account={account} data={decoded.data} />;
    }
}

function PlanCard({ account, data }: { account: Account; data: Plan }) {
    const refresh = useRefreshAccount();
    const { data: planData, owner, status } = data;
    const { endTs, metadataUri, mint, planId, terms } = planData;
    return (
        <AccountCard
            title="Subscription Plan"
            account={account}
            analyticsSection="subscriptions_plan_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <ValueRow label="Plan ID">{planId.toString()}</ValueRow>
            <ValueRow label="Status">{formatPlanStatus(status)}</ValueRow>
            <AddressRow address={owner} label="Owner" />
            <AddressRow address={mint} label="Token Mint" />
            <ValueRow label="Amount per Period">{terms.amount.toString()}</ValueRow>
            <ValueRow label="Period">{pluralUnits(terms.periodHours, 'hour')}</ValueRow>
            {terms.createdAt !== 0n && (
                <ValueRow label="Created At">{displayTimestampUtc(tsToMs(terms.createdAt), true)}</ValueRow>
            )}
            <ValueRow label="Expires At">{formatExpiry(endTs)}</ValueRow>
            {metadataUri && (
                <ValueRow label="Metadata URI">
                    <span className="e-font-mono">{metadataUri}</span>
                </ValueRow>
            )}
        </AccountCard>
    );
}

function SubscriptionAuthorityCard({ account, data }: { account: Account; data: SubscriptionAuthority }) {
    const refresh = useRefreshAccount();
    const { initId, payer, tokenMint, user } = data;
    return (
        <AccountCard
            title="Subscription Authority"
            account={account}
            analyticsSection="subscriptions_authority_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AddressRow address={user} label="User" />
            <AddressRow address={tokenMint} label="Token Mint" />
            <AddressRow address={payer} label="Payer" />
            <ValueRow label="Init ID">{initId.toString()}</ValueRow>
        </AccountCard>
    );
}

function FixedDelegationCard({ account, data }: { account: Account; data: FixedDelegation }) {
    const refresh = useRefreshAccount();
    const { amount, expiryTs, header, mint, subscriptionAuthority } = data;
    return (
        <AccountCard
            title="Fixed Delegation"
            account={account}
            analyticsSection="subscriptions_fixed_delegation_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <DelegationHeaderRows header={header} />
            <ValueRow label="Amount">{amount.toString()}</ValueRow>
            <AddressRow address={mint} label="Token Mint" />
            <AddressRow address={subscriptionAuthority} label="Subscription Authority" />
            <ValueRow label="Expires At">{formatExpiry(expiryTs)}</ValueRow>
            <AddressRow address={header.payer} label="Payer" />
        </AccountCard>
    );
}

function RecurringDelegationCard({ account, data }: { account: Account; data: RecurringDelegation }) {
    const refresh = useRefreshAccount();
    const {
        amountPerPeriod,
        amountPulledInPeriod,
        currentPeriodStartTs,
        expiryTs,
        header,
        mint,
        periodLengthS,
        subscriptionAuthority,
    } = data;
    return (
        <AccountCard
            title="Recurring Delegation"
            account={account}
            analyticsSection="subscriptions_recurring_delegation_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <DelegationHeaderRows header={header} />
            <ValueRow label="Amount per Period">{amountPerPeriod.toString()}</ValueRow>
            <ValueRow label="Amount Pulled (this period)">{amountPulledInPeriod.toString()}</ValueRow>
            <AddressRow address={mint} label="Token Mint" />
            <ValueRow label="Period Length">{pluralUnits(periodLengthS, 'second')}</ValueRow>
            {currentPeriodStartTs !== 0n && (
                <ValueRow label="Current Period Start">
                    {displayTimestampUtc(tsToMs(currentPeriodStartTs), true)}
                </ValueRow>
            )}
            <ValueRow label="Expires At">{formatExpiry(expiryTs)}</ValueRow>
            <AddressRow address={subscriptionAuthority} label="Subscription Authority" />
            <AddressRow address={header.payer} label="Payer" />
        </AccountCard>
    );
}

function SubscriptionDelegationCard({ account, data }: { account: Account; data: SubscriptionDelegation }) {
    const refresh = useRefreshAccount();
    const { amountPulledInPeriod, currentPeriodStartTs, expiresAtTs, header, terms } = data;
    return (
        <AccountCard
            title="Subscription Delegation"
            account={account}
            analyticsSection="subscriptions_delegation_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <DelegationHeaderRows header={header} />
            <ValueRow label="Amount">{terms.amount.toString()}</ValueRow>
            <ValueRow label="Period">{pluralUnits(terms.periodHours, 'hour')}</ValueRow>
            <ValueRow label="Amount Pulled (this period)">{amountPulledInPeriod.toString()}</ValueRow>
            {currentPeriodStartTs !== 0n && (
                <ValueRow label="Current Period Start">
                    {displayTimestampUtc(tsToMs(currentPeriodStartTs), true)}
                </ValueRow>
            )}
            <ValueRow label="Expires At">{formatExpiry(expiresAtTs)}</ValueRow>
            <AddressRow address={header.payer} label="Payer" />
        </AccountCard>
    );
}
