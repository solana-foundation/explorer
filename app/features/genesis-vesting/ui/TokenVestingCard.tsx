'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { RefreshButton } from '@components/shared/ui/refresh-button';
import { useMintAccountInfo } from '@providers/accounts';

import { readVestingLock } from '../lib/read-vesting-lock';
import { useUnixTime } from '../model/use-unix-time';
import { useVestingLocks } from '../model/use-vesting-locks';
import { BaseTokenVesting } from './BaseTokenVesting';

/** Vesting tab content for a token mint. */
export function TokenVestingCard({ mint }: { mint: string }) {
    const { data: accounts, error, isValidating, mutate } = useVestingLocks(mint, { revalidateIfStale: true });
    const mintInfo = useMintAccountInfo(mint);
    // Vested amounts grow with time, so the locks are evaluated at a clock that keeps ticking while the page is open.
    const now = useUnixTime();

    if (error && !accounts) return <ErrorCard text="Failed to load vesting locks." retry={() => mutate()} />;
    if (!accounts || !mintInfo) return <LoadingCard />;

    const locks = accounts
        .flatMap(({ address, data }) => {
            const lock = readVestingLock(data, now);
            return lock ? [{ address, lock }] : [];
        })
        // getProgramAccounts returns no stable order; largest allocation first keeps the page stable.
        .sort((a, b) => (a.lock.allocation === b.lock.allocation ? 0 : a.lock.allocation > b.lock.allocation ? -1 : 1));

    if (locks.length === 0) return <ErrorCard text="No Genesis vesting locks found for this token." />;

    return (
        <BaseTokenVesting
            locks={locks}
            supply={BigInt(mintInfo.supply)}
            decimals={mintInfo.decimals}
            actions={
                <RefreshButton
                    analyticsSection="genesis_vesting_card"
                    fetching={isValidating}
                    failed={Boolean(error)}
                    onClick={() => mutate()}
                />
            }
        />
    );
}
