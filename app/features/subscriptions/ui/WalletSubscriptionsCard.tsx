'use client';

import { KitAddress } from '@components/common/KitAddress';
import type { Address } from '@solana/kit';
import type {
    FixedDelegation,
    PlanWithAddress,
    RecurringDelegation,
    SubscriptionDelegation,
} from '@solana/subscriptions';
import { pluralUnits } from '@utils/index';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { displayExpiry } from '../lib/format';
import {
    useWalletDelegations,
    useWalletPlans,
    type WalletDelegationsData,
    type WalletPlansData,
} from '../model/useWalletSubscriptions';

export function WalletSubscriptionsCard({ address }: { address: string }) {
    const { data: delegationsData } = useWalletDelegations(address);
    const { data: plansData } = useWalletPlans(address);

    if (!delegationsData || !plansData) return;

    return <WalletSubscriptionsView {...delegationsData} {...plansData} />;
}

export function WalletSubscriptionsView({
    delegations,
    delegationsReceived,
    plans,
}: WalletDelegationsData & WalletPlansData) {
    const subscriptions = delegations.filter((d): d is SubscriptionItem => d.kind === 'subscription');
    const standalone = delegations.filter(
        (d): d is StandaloneDelegation => d.kind === 'fixed' || d.kind === 'recurring',
    );
    const receivedSubscriptions = delegationsReceived.filter((d): d is SubscriptionItem => d.kind === 'subscription');
    const standaloneReceived = delegationsReceived.filter(
        (d): d is StandaloneDelegation => d.kind === 'fixed' || d.kind === 'recurring',
    );

    if (
        plans.length === 0 &&
        subscriptions.length === 0 &&
        standalone.length === 0 &&
        receivedSubscriptions.length === 0 &&
        standaloneReceived.length === 0
    ) {
        return <div className="e-p-4 e-text-center e-text-muted">No subscriptions found for this address.</div>;
    }

    return (
        <>
            {plans.length > 0 && <PlansSection plans={plans} />}
            {subscriptions.length > 0 && <SubscriptionsSection delegations={subscriptions} />}
            {standalone.length > 0 && <DelegationsSection delegations={standalone} />}
            {receivedSubscriptions.length > 0 && <ReceivedSubscriptionsSection delegations={receivedSubscriptions} />}
            {standaloneReceived.length > 0 && <ReceivedDelegationsSection delegations={standaloneReceived} />}
        </>
    );
}

type SubscriptionItem = { address: Address; data: SubscriptionDelegation; kind: 'subscription' };

type StandaloneDelegation =
    | { address: Address; data: FixedDelegation; kind: 'fixed' }
    | { address: Address; data: RecurringDelegation; kind: 'recurring' };

function PlansSection({ plans }: { plans: PlanWithAddress[] }) {
    return (
        <TableSection
            headers={['Account', 'Plan ID', 'Token Mint', 'Amount per Period', 'Period', 'Expires']}
            title="Plans"
        >
            {plans.map(plan => (
                <PlanRow key={plan.address} {...plan} />
            ))}
        </TableSection>
    );
}

function PlanRow({ address, data }: PlanWithAddress) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <KitAddress address={address} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>{data.data.planId.toString()}</BaseTable.Cell>
            <BaseTable.Cell>
                <KitAddress address={data.data.mint} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>{data.data.terms.amount.toString()}</BaseTable.Cell>
            <BaseTable.Cell>{pluralUnits(data.data.terms.periodHours, 'hour')}</BaseTable.Cell>
            <BaseTable.Cell>{displayExpiry(data.data.endTs)}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

function SubscriptionsSection({
    delegations,
}: {
    delegations: Array<{ address: Address; data: SubscriptionDelegation }>;
}) {
    return (
        <TableSection
            headers={['Account', 'Delegatee', 'Amount per Period', 'Period', 'Expires']}
            title="Subscriptions"
        >
            {delegations.map(d => (
                <SubscriptionRow key={d.address} {...d} />
            ))}
        </TableSection>
    );
}

function SubscriptionRow({ address, data }: { address: Address; data: SubscriptionDelegation }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <KitAddress address={address} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>
                <KitAddress address={data.header.delegatee} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>{data.terms.amount.toString()}</BaseTable.Cell>
            <BaseTable.Cell>{pluralUnits(data.terms.periodHours, 'hour')}</BaseTable.Cell>
            <BaseTable.Cell>{displayExpiry(data.expiresAtTs)}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

function DelegationsSection({ delegations }: { delegations: StandaloneDelegation[] }) {
    return (
        <TableSection headers={['Account', 'Type', 'Delegatee', 'Amount', 'Expires']} title="Delegations">
            {delegations.map(d => (
                <DelegationRow key={d.address} d={d} />
            ))}
        </TableSection>
    );
}

function DelegationRow({ d }: { d: StandaloneDelegation }) {
    const amount = d.kind === 'fixed' ? d.data.amount : d.data.amountPerPeriod;
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <KitAddress address={d.address} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>{d.kind === 'fixed' ? 'Fixed' : 'Recurring'}</BaseTable.Cell>
            <BaseTable.Cell>
                <KitAddress address={d.data.header.delegatee} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>{amount.toString()}</BaseTable.Cell>
            <BaseTable.Cell>{displayExpiry(d.data.expiryTs)}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

// Incoming subscriptions where this wallet is the delegatee (i.e. the merchant/puller),
// so the counterparty of interest is the delegator (the subscriber).
function ReceivedSubscriptionsSection({
    delegations,
}: {
    delegations: Array<{ address: Address; data: SubscriptionDelegation }>;
}) {
    return (
        <TableSection
            headers={['Account', 'Delegator', 'Amount per Period', 'Period', 'Expires']}
            title="Received Subscriptions"
        >
            {delegations.map(d => (
                <ReceivedSubscriptionRow key={d.address} {...d} />
            ))}
        </TableSection>
    );
}

function ReceivedSubscriptionRow({ address, data }: { address: Address; data: SubscriptionDelegation }) {
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <KitAddress address={address} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>
                <KitAddress address={data.header.delegator} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>{data.terms.amount.toString()}</BaseTable.Cell>
            <BaseTable.Cell>{pluralUnits(data.terms.periodHours, 'hour')}</BaseTable.Cell>
            <BaseTable.Cell>{displayExpiry(data.expiresAtTs)}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

function ReceivedDelegationsSection({ delegations }: { delegations: StandaloneDelegation[] }) {
    return (
        <TableSection headers={['Account', 'Type', 'Delegator', 'Amount', 'Expires']} title="Received Delegations">
            {delegations.map(d => (
                <ReceivedDelegationRow key={d.address} d={d} />
            ))}
        </TableSection>
    );
}

function ReceivedDelegationRow({ d }: { d: StandaloneDelegation }) {
    const amount = d.kind === 'fixed' ? d.data.amount : d.data.amountPerPeriod;
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <KitAddress address={d.address} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>{d.kind === 'fixed' ? 'Fixed' : 'Recurring'}</BaseTable.Cell>
            <BaseTable.Cell>
                <KitAddress address={d.data.header.delegator} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>{amount.toString()}</BaseTable.Cell>
            <BaseTable.Cell>{displayExpiry(d.data.expiryTs)}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

// Shared card + table shell used by every section above.
function TableSection({ children, headers, title }: { children: React.ReactNode; headers: string[]; title: string }) {
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    {title}
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        {headers.map(h => (
                            <BaseTable.HeaderCell key={h} className="text-dk-gray-700">
                                {h}
                            </BaseTable.HeaderCell>
                        ))}
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>{children}</BaseTable.Body>
            </BaseTable>
        </Card>
    );
}
