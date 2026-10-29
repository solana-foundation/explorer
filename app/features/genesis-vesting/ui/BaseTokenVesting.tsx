import { Address } from '@components/common/Address';
import type { Address as KitAddress } from '@solana/kit';
import type { ReactNode } from 'react';

import { type KeyValueRowInput, KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';
import { BaseTable } from '@/app/shared/ui/Table';

import { formatAmount, formatPercent, formatTime, STATUS_LABELS } from '../lib/format';
import type { VestingLock } from '../lib/read-vesting-lock';
import { BaseVestingLockRows } from './BaseVestingLockRows';

/** Above this many locks the tab lists them in one table; each row links to the lock's own page. */
const MAX_LOCK_CARDS = 3;

export type BaseTokenVestingProps = {
    locks: ReadonlyArray<{ address: KitAddress; lock: VestingLock }>;
    supply: bigint;
    decimals: number;
    /** Controls in the summary card header, such as a refresh button. */
    actions?: ReactNode;
};

export function BaseTokenVesting({ locks, supply, decimals, actions }: BaseTokenVestingProps) {
    const locked = locks.reduce((sum, { lock }) => sum + lock.locked, 0n);
    const summary: KeyValueRowInput[] = [
        { label: 'Total Supply', value: formatAmount(supply, decimals) },
        { label: 'Locked in Vesting', value: `${formatAmount(locked, decimals)} (${formatPercent(locked, supply)})` },
        // Only Genesis vesting is subtracted; unclaimed sale tokens and other holdings still count as circulating.
        { label: 'Circulating (excl. Genesis vesting)', value: formatAmount(supply - locked, decimals) },
        { label: 'Vesting Locks', value: locks.length },
    ];

    return (
        <div className="flex flex-col gap-6">
            <OverviewCard title="Genesis Vesting" actions={actions}>
                <KeyValueRows rows={summary} />
            </OverviewCard>
            {locks.length > MAX_LOCK_CARDS ? (
                <VestingLockTable locks={locks} decimals={decimals} />
            ) : (
                locks.map(({ address, lock }) => (
                    <OverviewCard key={address} title="Vesting Lock">
                        <KeyValueRows
                            rows={[{ label: 'Lock', value: <Address address={address} alignRight link /> }]}
                        />
                        <BaseVestingLockRows lock={lock} decimals={decimals} />
                    </OverviewCard>
                ))
            )}
        </div>
    );
}

function VestingLockTable({ locks, decimals }: Pick<BaseTokenVestingProps, 'locks' | 'decimals'>) {
    return (
        <OverviewCard title="Vesting Locks">
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell>Lock</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="hidden lg:table-cell">Recipient</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="hidden md:table-cell">Status</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell>Locked</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="hidden md:table-cell">Next Unlock</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>
                    {locks.map(({ address, lock }) => (
                        <BaseTable.Row key={address}>
                            <BaseTable.Cell>
                                <Address address={address} link />
                            </BaseTable.Cell>
                            <BaseTable.Cell className="hidden lg:table-cell">
                                <Address address={lock.recipient} link />
                            </BaseTable.Cell>
                            <BaseTable.Cell className="hidden md:table-cell">
                                {STATUS_LABELS[lock.status]}
                            </BaseTable.Cell>
                            <BaseTable.Cell>{formatAmount(lock.locked, decimals)}</BaseTable.Cell>
                            <BaseTable.Cell className="hidden md:table-cell">
                                {lock.nextUnlock ? formatTime(lock.nextUnlock.time) : 'None'}
                            </BaseTable.Cell>
                        </BaseTable.Row>
                    ))}
                </BaseTable.Body>
            </BaseTable>
        </OverviewCard>
    );
}
