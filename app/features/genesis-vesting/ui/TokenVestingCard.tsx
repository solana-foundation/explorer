'use client';

import { ErrorCard } from '@components/common/ErrorCard';
import { LoadingCard } from '@components/common/LoadingCard';
import { useMintAccountInfo } from '@providers/accounts';

import { readVestingLock } from '../lib/read-vesting-lock';
import { useVestingLocks } from '../model/use-vesting-locks';
import { BaseTokenVesting } from './BaseTokenVesting';

/** Vesting tab content for a token mint. Suspends while the locks load. */
export function TokenVestingCard({ mint }: { mint: string }) {
    const { data: accounts = [] } = useVestingLocks(mint);
    const mintInfo = useMintAccountInfo(mint);

    if (!mintInfo) return <LoadingCard />;

    // Vested amounts grow with time, so each render evaluates the locks at the current time.
    const now = Math.floor(Date.now() / 1000);
    const locks = accounts
        .flatMap(({ address, data }) => {
            const lock = readVestingLock(data, now);
            return lock ? [{ address, lock }] : [];
        })
        // getProgramAccounts returns no stable order; largest allocation first keeps the page stable.
        .sort((a, b) => (a.lock.allocation === b.lock.allocation ? 0 : a.lock.allocation > b.lock.allocation ? -1 : 1));

    if (locks.length === 0) return <ErrorCard text="No Genesis vesting locks found for this token." />;

    return <BaseTokenVesting locks={locks} supply={BigInt(mintInfo.supply)} decimals={mintInfo.decimals} />;
}
