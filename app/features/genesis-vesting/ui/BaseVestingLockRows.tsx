import { Address } from '@components/common/Address';

import { type KeyValueRowInput, KeyValueRows } from '@/app/shared/ui/key-value';

import { formatAmount, formatBps, formatDuration, formatPercent, formatTime, STATUS_LABELS } from '../lib/format';
import type { VestingLock } from '../lib/read-vesting-lock';

export type BaseVestingLockRowsProps = {
    lock: VestingLock;
    decimals: number;
};

export function BaseVestingLockRows({ lock, decimals }: BaseVestingLockRowsProps) {
    const { schedule, nextUnlock } = lock;
    const amount = (value: bigint) => formatAmount(value, decimals);

    const rows: KeyValueRowInput[] = [
        { label: 'Status', value: STATUS_LABELS[lock.status] },
        { label: 'Recipient', value: <Address address={lock.recipient} alignRight link /> },
        { label: 'Allocation', value: amount(lock.allocation) },
        { label: 'Vested', value: `${amount(lock.vested)} (${formatPercent(lock.vested, lock.allocation)})` },
        { label: 'Claimed', value: amount(lock.claimed) },
        { label: 'Claimable Now', value: amount(lock.claimableNow) },
        { label: 'Locked', value: amount(lock.locked) },
        {
            label: 'Cliff',
            value: schedule.cliffBps ? `${formatBps(schedule.cliffBps)} on ${formatTime(schedule.cliff)}` : 'None',
        },
        {
            label: 'Linear Unlock',
            value:
                schedule.linearStart === undefined
                    ? formatTime(undefined)
                    : `${formatTime(schedule.linearStart)} to ${formatTime(schedule.linearEnd)}, every ${formatDuration(schedule.period)}`,
        },
        {
            label: 'Claims Open',
            value: schedule.claimOpens === 'always' ? 'Always' : formatTime(schedule.claimOpens),
        },
        schedule.secondsPaused > 0 && {
            label: 'Paused For',
            value: `${formatDuration(schedule.secondsPaused)}; later unlocks move back by this time`,
        },
        {
            label: 'Next Unlock',
            value: nextUnlock ? `${amount(nextUnlock.amount)} on ${formatTime(nextUnlock.time)}` : 'None',
        },
        { label: 'Schedule Changes', value: policyLabel(lock.policy) },
    ];

    return <KeyValueRows rows={rows} />;
}

function policyLabel(policy: VestingLock['policy']): string {
    const allowed = [
        policy.pausable && 'Pausable',
        policy.cancelable && 'Cancelable',
        policy.cancelableByRecipient && 'Cancelable by recipient',
        policy.transferable && 'Transferable',
        policy.transferableByRecipient && 'Transferable by recipient',
    ].filter(Boolean);
    return allowed.length > 0 ? allowed.join(', ') : 'None';
}
