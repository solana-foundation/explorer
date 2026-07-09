'use client';

import { KitAddress } from '@components/common/KitAddress';
import type { Address } from '@solana/kit';
import type {
    FixedDelegation,
    PlanWithAddress,
    RecurringDelegation,
    SubscriptionDelegation,
} from '@solana/subscriptions';
import { displayTimestampUtc } from '@utils/date';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

import { useWalletSubscriptions, type WalletSubscriptionsData } from '../model/useWalletSubscriptions';

function tsToMs(ts: bigint): number {
    return Number(ts) * 1000;
}

function formatExpiry(ts: bigint): string {
    if (ts === 0n) return 'Never';
    return displayTimestampUtc(tsToMs(ts), true);
}

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

function PlanRow({ address, data }: PlanWithAddress) {
    const planPath = useClusterPath({ pathname: `/address/${data.owner}` });
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <KitAddress address={address} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>
                <Link href={planPath}>{data.data.planId.toString()}</Link>
            </BaseTable.Cell>
            <BaseTable.Cell>
                <KitAddress address={data.data.mint} raw link />
            </BaseTable.Cell>
            <BaseTable.Cell>{data.data.terms.amount.toString()}</BaseTable.Cell>
            <BaseTable.Cell>{data.data.terms.periodHours.toString()} hours</BaseTable.Cell>
            <BaseTable.Cell>{formatExpiry(data.data.endTs)}</BaseTable.Cell>
        </BaseTable.Row>
    );
}

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
            <BaseTable.Cell>{data.terms.periodHours.toString()} hours</BaseTable.Cell>
            <BaseTable.Cell>{formatExpiry(data.expiresAtTs)}</BaseTable.Cell>
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

type StandaloneDelegation =
    | { address: Address; data: FixedDelegation; kind: 'fixed' }
    | { address: Address; data: RecurringDelegation; kind: 'recurring' };

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
            <BaseTable.Cell>{formatExpiry(d.data.expiryTs)}</BaseTable.Cell>
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

export function WalletSubscriptionsView({ data }: { data: WalletSubscriptionsData }) {
    const { delegations, plans } = data;
    const subscriptions = delegations.filter(
        (d): d is { address: Address; data: SubscriptionDelegation; kind: 'subscription' } => d.kind === 'subscription',
    );
    const standalone = delegations.filter(
        (d): d is StandaloneDelegation => d.kind === 'fixed' || d.kind === 'recurring',
    );

    return (
        <>
            {plans.length > 0 && <PlansSection plans={plans} />}
            {subscriptions.length > 0 && <SubscriptionsSection delegations={subscriptions} />}
            {standalone.length > 0 && <DelegationsSection delegations={standalone} />}
        </>
    );
}

export function WalletSubscriptionsCard({ address }: { address: string }) {
    const { data } = useWalletSubscriptions(address);

    if (!data) return;

    return <WalletSubscriptionsView data={data} />;
}
