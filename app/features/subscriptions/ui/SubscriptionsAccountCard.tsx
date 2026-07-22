'use client';

import { KitAddress } from '@components/common/KitAddress';
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

import { BaseAccountCard, type BaseAccountCardProps } from '@/app/shared/ui/BaseAccountCard';
import { BaseRawAccountRows } from '@/app/shared/ui/BaseRawAccountRows';
import { BaseTable } from '@/app/shared/ui/Table';

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
    return (
        <SubscriptionCard
            title="Subscription Plan"
            account={account}
            analyticsSection="subscriptions_plan_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <ValueRow label="Plan ID">{planId.toString()}</ValueRow>
            <ValueRow label="Status">{displayPlanStatus(status)}</ValueRow>
            <AddressRow address={owner} label="Owner" />
            <AddressRow address={mint} label="Token Mint" />
            <ValueRow label="Amount per Period">{terms.amount.toString()}</ValueRow>
            <ValueRow label="Period">{pluralUnits(terms.periodHours, 'hour')}</ValueRow>
            {terms.createdAt !== 0n && (
                <ValueRow label="Created At">
                    {displayTimestampUtc(unixTimestampToMs(Number(terms.createdAt)), true)}
                </ValueRow>
            )}
            <ValueRow label="Expires At">{displayExpiry(endTs)}</ValueRow>
            {metadataUri && (
                <ValueRow label="Metadata URI">
                    <span className="e-font-mono">{metadataUri}</span>
                </ValueRow>
            )}
        </SubscriptionCard>
    );
}

function FixedDelegationCard({ account, data }: { account: Account; data: FixedDelegation }) {
    const refresh = useRefreshAccount();
    const { amount, expiryTs, header, mint, subscriptionAuthority } = data;
    return (
        <SubscriptionCard
            title="Fixed Delegation"
            account={account}
            analyticsSection="subscriptions_fixed_delegation_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <DelegationHeaderRows header={header} />
            <ValueRow label="Amount">{amount.toString()}</ValueRow>
            <AddressRow address={mint} label="Token Mint" />
            <AddressRow address={subscriptionAuthority} label="Subscription Authority" />
            <ValueRow label="Expires At">{displayExpiry(expiryTs)}</ValueRow>
            <AddressRow address={header.payer} label="Payer" />
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
    return (
        <SubscriptionCard
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
                    {displayTimestampUtc(unixTimestampToMs(Number(currentPeriodStartTs)), true)}
                </ValueRow>
            )}
            <ValueRow label="Expires At">{displayExpiry(expiryTs)}</ValueRow>
            <AddressRow address={subscriptionAuthority} label="Subscription Authority" />
            <AddressRow address={header.payer} label="Payer" />
        </SubscriptionCard>
    );
}

function SubscriptionDelegationCard({ account, data }: { account: Account; data: SubscriptionDelegation }) {
    const refresh = useRefreshAccount();
    const { amountPulledInPeriod, currentPeriodStartTs, expiresAtTs, header, terms } = data;
    return (
        <SubscriptionCard
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
                    {displayTimestampUtc(unixTimestampToMs(Number(currentPeriodStartTs)), true)}
                </ValueRow>
            )}
            <ValueRow label="Expires At">{displayExpiry(expiresAtTs)}</ValueRow>
            <AddressRow address={header.payer} label="Payer" />
        </SubscriptionCard>
    );
}

function SubscriptionAuthorityCard({ account, data }: { account: Account; data: SubscriptionAuthority }) {
    const refresh = useRefreshAccount();
    const { initId, payer, tokenMint, user } = data;
    return (
        <SubscriptionCard
            title="Subscription Authority"
            account={account}
            analyticsSection="subscriptions_authority_card"
            refresh={() => refresh(account.pubkey, 'parsed')}
        >
            <AddressRow address={user} label="User" />
            <AddressRow address={tokenMint} label="Token Mint" />
            <AddressRow address={payer} label="Payer" />
            <ValueRow label="Init ID">{initId.toString()}</ValueRow>
        </SubscriptionCard>
    );
}

// Card shell for all subscriptions account types — wires up raw data view automatically.
type SubscriptionCardProps = Omit<BaseAccountCardProps, 'rawContent'> & { account: Account };

function SubscriptionCard({ account, children, ...rest }: SubscriptionCardProps) {
    const { data, isLoading } = useRawAccountDataOnMount(account.pubkey);
    return (
        <BaseAccountCard
            rawContent={<BaseRawAccountRows account={account} rawData={data} isLoading={isLoading} />}
            {...rest}
        >
            {children}
        </BaseAccountCard>
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

function AddressRow({ address, label }: { address: Address; label: string }) {
    return (
        <ValueRow label={label}>
            <KitAddress address={address} raw link />
        </ValueRow>
    );
}

function ValueRow({ children, label }: { children: React.ReactNode; label: string }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>{label}</BaseTable.Cell>
            <BaseTable.Cell className="e-text-right">{children}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

function displayPlanStatus(status: number): string {
    if (status === PlanStatus.Active) return 'Active';
    if (status === PlanStatus.Sunset) return 'Sunset';
    return `Unknown (${status})`;
}
