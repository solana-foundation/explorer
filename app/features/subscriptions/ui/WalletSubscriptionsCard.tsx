'use client';

import { KitAddress } from '@components/common/KitAddress';
import { ExternalLink } from '@components/shared/ui/external-link';
import { cn } from '@components/shared/utils';
import type { Address } from '@solana/kit';
import type {
    FixedDelegation,
    PlanWithAddress,
    RecurringDelegation,
    SubscriptionDelegation,
} from '@solana/subscriptions';
import { pluralUnits } from '@utils/index';
import { Fragment, useState } from 'react';
import { ExternalLink as ExternalLinkIcon, Info } from 'react-feather';

import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { ExpandInfoButton } from '@/app/shared/ui/ExpandInfoButton';
import { BaseTable } from '@/app/shared/ui/Table';

import { SUBSCRIPTIONS_REPO_URL } from '../lib/constants';
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
        return (
            <>
                <SubscriptionsHint />
                <div className="p-4 text-center text-muted">No subscriptions found for this address.</div>
            </>
        );
    }

    return (
        <>
            <SubscriptionsHint />
            {plans.length > 0 && (
                <TableSection title="Plans" columns={PLAN_COLUMNS} items={plans} getKey={p => p.address} />
            )}
            {subscriptions.length > 0 && (
                <TableSection
                    title="Subscriptions"
                    columns={SUBSCRIPTION_COLUMNS}
                    items={subscriptions}
                    getKey={s => s.address}
                />
            )}
            {standalone.length > 0 && (
                <TableSection
                    title="Delegations"
                    columns={DELEGATION_COLUMNS}
                    items={standalone}
                    getKey={d => d.address}
                />
            )}
            {receivedSubscriptions.length > 0 && (
                <TableSection
                    title="Received Subscriptions"
                    columns={RECEIVED_SUBSCRIPTION_COLUMNS}
                    items={receivedSubscriptions}
                    getKey={s => s.address}
                />
            )}
            {standaloneReceived.length > 0 && (
                <TableSection
                    title="Received Delegations"
                    columns={RECEIVED_DELEGATION_COLUMNS}
                    items={standaloneReceived}
                    getKey={d => d.address}
                />
            )}
        </>
    );
}

// A subtle info note explaining what this tab lists, with a link to the program's source.
function SubscriptionsHint() {
    return (
        <div className="mb-4 flex items-start gap-2 rounded-dk border border-solid border-dk-gray-700-dark bg-dk-gray-800-dark px-4 py-3 text-dk-sm text-muted">
            <Info aria-hidden className="mt-0.5 shrink-0 text-dk-info" size={15} />
            <span>
                Here you can see all subscriptions handled by the{' '}
                <ExternalLink
                    className="whitespace-nowrap text-dk-primary-dark hover:underline"
                    href={SUBSCRIPTIONS_REPO_URL}
                >
                    Subscriptions program
                    <ExternalLinkIcon className="ml-1 inline align-text-top" size={12} />
                </ExternalLink>
                .
            </span>
        </div>
    );
}

type SubscriptionItem = { address: Address; data: SubscriptionDelegation; kind: 'subscription' };

type StandaloneDelegation =
    | { address: Address; data: FixedDelegation; kind: 'fixed' }
    | { address: Address; data: RecurringDelegation; kind: 'recurring' };

// A single table column. `primary` columns stay visible on every breakpoint; the rest collapse
// into an expandable detail row on small screens (mirrors the feature-gates table pattern).
type Column<T> = {
    header: string;
    cell: (item: T) => React.ReactNode;
    primary?: boolean;
};

const PLAN_COLUMNS: Column<PlanWithAddress>[] = [
    { cell: p => <KitAddress address={p.address} raw link />, header: 'Account', primary: true },
    { cell: p => p.data.data.planId.toString(), header: 'Plan ID', primary: true },
    { cell: p => <KitAddress address={p.data.data.mint} raw link />, header: 'Token Mint' },
    { cell: p => p.data.data.terms.amount.toString(), header: 'Amount per Period' },
    { cell: p => pluralUnits(p.data.data.terms.periodHours, 'hour'), header: 'Period' },
    { cell: p => displayExpiry(p.data.data.endTs), header: 'Expires' },
];

const SUBSCRIPTION_COLUMNS: Column<SubscriptionItem>[] = [
    { cell: s => <KitAddress address={s.address} raw link />, header: 'Account', primary: true },
    { cell: s => <KitAddress address={s.data.header.delegatee} raw link />, header: 'Delegatee', primary: true },
    { cell: s => s.data.terms.amount.toString(), header: 'Amount per Period' },
    { cell: s => pluralUnits(s.data.terms.periodHours, 'hour'), header: 'Period' },
    { cell: s => displayExpiry(s.data.expiresAtTs), header: 'Expires' },
];

const RECEIVED_SUBSCRIPTION_COLUMNS: Column<SubscriptionItem>[] = [
    { cell: s => <KitAddress address={s.address} raw link />, header: 'Account', primary: true },
    { cell: s => <KitAddress address={s.data.header.delegator} raw link />, header: 'Delegator', primary: true },
    { cell: s => s.data.terms.amount.toString(), header: 'Amount per Period' },
    { cell: s => pluralUnits(s.data.terms.periodHours, 'hour'), header: 'Period' },
    { cell: s => displayExpiry(s.data.expiresAtTs), header: 'Expires' },
];

const DELEGATION_COLUMNS: Column<StandaloneDelegation>[] = [
    { cell: d => <KitAddress address={d.address} raw link />, header: 'Account', primary: true },
    { cell: d => (d.kind === 'fixed' ? 'Fixed' : 'Recurring'), header: 'Type' },
    { cell: d => <KitAddress address={d.data.header.delegatee} raw link />, header: 'Delegatee', primary: true },
    { cell: d => (d.kind === 'fixed' ? d.data.amount : d.data.amountPerPeriod).toString(), header: 'Amount' },
    { cell: d => displayExpiry(d.data.expiryTs), header: 'Expires' },
];

const RECEIVED_DELEGATION_COLUMNS: Column<StandaloneDelegation>[] = [
    { cell: d => <KitAddress address={d.address} raw link />, header: 'Account', primary: true },
    { cell: d => (d.kind === 'fixed' ? 'Fixed' : 'Recurring'), header: 'Type' },
    { cell: d => <KitAddress address={d.data.header.delegator} raw link />, header: 'Delegator', primary: true },
    { cell: d => (d.kind === 'fixed' ? d.data.amount : d.data.amountPerPeriod).toString(), header: 'Amount' },
    { cell: d => displayExpiry(d.data.expiryTs), header: 'Expires' },
];

// Shared card + responsive table shell used by every section above. On large screens it renders a
// plain multi-column table; below `lg` the non-primary columns are hidden and revealed per-row
// through an expandable detail list, so the table never scrolls horizontally on mobile.
function TableSection<T>({
    columns,
    getKey,
    items,
    title,
}: {
    columns: Column<T>[];
    getKey: (item: T) => string;
    items: T[];
    title: string;
}) {
    const lastIndex = columns.length - 1;
    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    {title}
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card">
                <BaseTable.Head>
                    <BaseTable.Row>
                        {columns.map((col, i) => (
                            <BaseTable.HeaderCell
                                key={col.header}
                                // `variant="card"` pins the right edge padding on the last DOM cell,
                                // which is now the (mobile-only) toggle column — so restore it on the
                                // last data column at `lg` and up.
                                className={cn(
                                    'whitespace-nowrap text-dk-gray-700',
                                    !col.primary && 'hidden lg:table-cell',
                                    i === lastIndex && 'lg:!pr-6',
                                )}
                            >
                                {col.header}
                            </BaseTable.HeaderCell>
                        ))}
                        <BaseTable.HeaderCell className="w-10 lg:hidden" aria-label="Toggle details" />
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>
                    {items.map(item => (
                        <TableRow key={getKey(item)} columns={columns} item={item} rowKey={getKey(item)} />
                    ))}
                </BaseTable.Body>
            </BaseTable>
        </Card>
    );
}

function TableRow<T>({ columns, item, rowKey }: { columns: Column<T>[]; item: T; rowKey: string }) {
    const [expanded, setExpanded] = useState(false);
    const detailId = `subscription-row-${rowKey}`;
    const secondary = columns.filter(col => !col.primary);
    const lastIndex = columns.length - 1;
    const toggle = () => setExpanded(prev => !prev);

    // Whole-row click is a mobile convenience; skip clicks that land on a real control (address
    // links or the toggle button itself) so they keep their own behaviour.
    const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>) => {
        if ((event.target as HTMLElement).closest('a, button')) return;
        toggle();
    };

    return (
        <Fragment>
            <BaseTable.Row className="cursor-pointer lg:cursor-default" onClick={handleRowClick}>
                {columns.map((col, i) => (
                    <BaseTable.Cell
                        key={col.header}
                        className={cn(
                            'whitespace-nowrap',
                            !col.primary && 'hidden lg:table-cell',
                            i === lastIndex && 'lg:!pr-6',
                        )}
                    >
                        {col.cell(item)}
                    </BaseTable.Cell>
                ))}
                <BaseTable.Cell className="w-10 lg:hidden">
                    <ExpandInfoButton isExpanded={expanded} onToggle={toggle} controlsId={detailId} />
                </BaseTable.Cell>
            </BaseTable.Row>
            {expanded && (
                <BaseTable.Row className="lg:hidden">
                    <BaseTable.Cell className="!border-t-0 !pt-0" colSpan={columns.length + 1}>
                        <dl id={detailId} className="flex flex-col gap-3">
                            {secondary.map(col => (
                                <div key={col.header} className="flex flex-col gap-0.5">
                                    <dt className="text-dk-xs uppercase tracking-[0.08em] text-dark-muted-foreground">
                                        {col.header}
                                    </dt>
                                    <dd className="text-white [overflow-wrap:anywhere]">{col.cell(item)}</dd>
                                </div>
                            ))}
                        </dl>
                    </BaseTable.Cell>
                </BaseTable.Row>
            )}
        </Fragment>
    );
}
