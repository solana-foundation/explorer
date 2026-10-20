'use client';

import { KitAddress } from '@components/common/KitAddress';
import { RefreshButton } from '@components/shared/ui/refresh-button';
import { useRawAccountDataOnMount, useRefreshAccount } from '@entities/account';
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
import { displayTimestampUtc, unixTimestampToMs } from '@utils/date';
import { pluralUnits } from '@utils/index';
import { type ReactNode, useState } from 'react';
import { Code } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { BaseRawAccountRows } from '@/app/shared/ui/BaseRawAccountRows';
import { type KeyValueRow, type KeyValueRowInput, KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

import { decodeSubscriptionsAccount } from '../lib/decode-subscriptions-account';
import { displayExpiry } from '../lib/format';

export function SubscriptionsAccountCard({ account, onNotFound }: { account?: Account; onNotFound: () => never }) {
    if (!account) return onNotFound();
    const raw = account.data.raw;
    if (!raw) return onNotFound();

    const decoded = decodeSubscriptionsAccount(account.pubkey.toBase58(), raw);
    if (!decoded) return onNotFound();

    switch (decoded.program) {
        case 'Plan':
            return <PlanCard account={account} data={decoded.parsed} />;
        case 'FixedDelegation':
            return <FixedDelegationCard account={account} data={decoded.parsed} />;
        case 'RecurringDelegation':
            return <RecurringDelegationCard account={account} data={decoded.parsed} />;
        case 'SubscriptionDelegation':
            return <SubscriptionDelegationCard account={account} data={decoded.parsed} />;
        case 'SubscriptionAuthority':
            return <SubscriptionAuthorityCard account={account} data={decoded.parsed} />;
    }
}

function PlanCard({ account, data }: { account: Account; data: Plan }) {
    const refresh = useRefreshAccount();
    const { data: planData, owner, status } = data;
    const { endTs, metadataUri, mint, planId, terms } = planData;
    const rows: KeyValueRowInput[] = [
        { label: 'Plan ID', value: planId.toString() },
        { label: 'Status', value: displayPlanStatus(status) },
        { label: 'Owner', value: addressValue(owner) },
        { label: 'Token Mint', value: addressValue(mint) },
        { label: 'Amount per Period', value: terms.amount.toString() },
        { label: 'Period', value: pluralUnits(terms.periodHours, 'hour') },
        terms.createdAt !== 0n && {
            label: 'Created At',
            value: displayTimestampUtc(unixTimestampToMs(Number(terms.createdAt)), true),
        },
        { label: 'Expires At', value: displayExpiry(endTs) },
        metadataUri && {
            label: 'Metadata URI',
            value: <span className="font-mono">{metadataUri}</span>,
            valueClassName: '!whitespace-normal [overflow-wrap:anywhere]',
        },
    ];
    return (
        <SubscriptionCard
            title="Subscription Plan"
            account={account}
            analyticsSection="subscriptions_plan_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <KeyValueRows rows={rows} />
        </SubscriptionCard>
    );
}

function FixedDelegationCard({ account, data }: { account: Account; data: FixedDelegation }) {
    const refresh = useRefreshAccount();
    const { amount, expiryTs, header, mint, subscriptionAuthority } = data;
    const rows: KeyValueRow[] = [
        ...delegationHeaderRows(header),
        { label: 'Amount', value: amount.toString() },
        { label: 'Token Mint', value: addressValue(mint) },
        { label: 'Subscription Authority', value: addressValue(subscriptionAuthority) },
        { label: 'Expires At', value: displayExpiry(expiryTs) },
        { label: 'Payer', value: addressValue(header.payer) },
    ];
    return (
        <SubscriptionCard
            title="Fixed Delegation"
            account={account}
            analyticsSection="subscriptions_fixed_delegation_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <KeyValueRows rows={rows} />
        </SubscriptionCard>
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
    const rows: KeyValueRowInput[] = [
        ...delegationHeaderRows(header),
        { label: 'Amount per Period', value: amountPerPeriod.toString() },
        { label: 'Amount Pulled (this period)', value: amountPulledInPeriod.toString() },
        { label: 'Token Mint', value: addressValue(mint) },
        { label: 'Period Length', value: pluralUnits(periodLengthS, 'second') },
        currentPeriodStartTs !== 0n && {
            label: 'Current Period Start',
            value: displayTimestampUtc(unixTimestampToMs(Number(currentPeriodStartTs)), true),
        },
        { label: 'Expires At', value: displayExpiry(expiryTs) },
        { label: 'Subscription Authority', value: addressValue(subscriptionAuthority) },
        { label: 'Payer', value: addressValue(header.payer) },
    ];
    return (
        <SubscriptionCard
            title="Recurring Delegation"
            account={account}
            analyticsSection="subscriptions_recurring_delegation_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <KeyValueRows rows={rows} />
        </SubscriptionCard>
    );
}

function SubscriptionDelegationCard({ account, data }: { account: Account; data: SubscriptionDelegation }) {
    const refresh = useRefreshAccount();
    const { amountPulledInPeriod, currentPeriodStartTs, expiresAtTs, header, terms } = data;
    const rows: KeyValueRowInput[] = [
        ...delegationHeaderRows(header),
        { label: 'Amount', value: terms.amount.toString() },
        { label: 'Period', value: pluralUnits(terms.periodHours, 'hour') },
        { label: 'Amount Pulled (this period)', value: amountPulledInPeriod.toString() },
        currentPeriodStartTs !== 0n && {
            label: 'Current Period Start',
            value: displayTimestampUtc(unixTimestampToMs(Number(currentPeriodStartTs)), true),
        },
        { label: 'Expires At', value: displayExpiry(expiresAtTs) },
        { label: 'Payer', value: addressValue(header.payer) },
    ];
    return (
        <SubscriptionCard
            title="Subscription Delegation"
            account={account}
            analyticsSection="subscriptions_delegation_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <KeyValueRows rows={rows} />
        </SubscriptionCard>
    );
}

function SubscriptionAuthorityCard({ account, data }: { account: Account; data: SubscriptionAuthority }) {
    const refresh = useRefreshAccount();
    const { initId, payer, tokenMint, user } = data;
    const rows: KeyValueRow[] = [
        { label: 'User', value: addressValue(user) },
        { label: 'Token Mint', value: addressValue(tokenMint) },
        { label: 'Payer', value: addressValue(payer) },
        { label: 'Init ID', value: initId.toString() },
    ];
    return (
        <SubscriptionCard
            title="Subscription Authority"
            account={account}
            analyticsSection="subscriptions_authority_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <KeyValueRows rows={rows} />
        </SubscriptionCard>
    );
}

type SubscriptionCardProps = {
    account: Account;
    title: ReactNode;
    analyticsSection?: string;
    refresh?: () => void;
    children: ReactNode;
};

function SubscriptionCard({ account, title, analyticsSection, refresh, children }: SubscriptionCardProps) {
    const [showRaw, setShowRaw] = useState(false);
    const { data, isLoading } = useRawAccountDataOnMount(account.pubkey);
    return (
        <OverviewCard
            title={title}
            actions={
                <>
                    {refresh && analyticsSection && (
                        <RefreshButton analyticsSection={analyticsSection} onClick={refresh} />
                    )}
                    <Button
                        variant={showRaw ? 'default' : 'outline'}
                        size="sm"
                        aria-label="Raw"
                        className={showRaw ? 'shadow-active-sm' : undefined}
                        onClick={() => setShowRaw(r => !r)}
                    >
                        <Code size={12} />
                        <span className="hidden md:inline">Raw</span>
                    </Button>
                </>
            }
        >
            {showRaw ? <BaseRawAccountRows account={account} rawData={data} isLoading={isLoading} /> : children}
        </OverviewCard>
    );
}

// Delegator + Delegatee rows shared by all three delegation account types.
type DelegationHeader = { delegatee: Address; delegator: Address; payer: Address };

function delegationHeaderRows(header: DelegationHeader): KeyValueRow[] {
    return [
        { label: 'Delegator', value: addressValue(header.delegator) },
        { label: 'Delegatee', value: addressValue(header.delegatee) },
    ];
}

function addressValue(address: Address): React.ReactNode {
    return <KitAddress address={address} raw link />;
}

function displayPlanStatus(status: number): string {
    if (status === PlanStatus.Active) return 'Active';
    if (status === PlanStatus.Sunset) return 'Sunset';
    return `Unknown (${status})`;
}
