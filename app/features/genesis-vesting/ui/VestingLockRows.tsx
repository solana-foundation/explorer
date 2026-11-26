'use client';

import { Address } from '@components/common/Address';
import { Button } from '@components/shared/ui/button';
import { type Account, useAccountInfo, useFetchAccountInfo, useMintAccountInfo } from '@providers/accounts';
import { FetchStatus } from '@providers/cache';
import { PublicKey } from '@solana/web3.js';
import { useEffect } from 'react';
import { RefreshCw } from 'react-feather';

import { KeyValueRows } from '@/app/shared/ui/key-value';

import { readVestingLock } from '../lib/read-vesting-lock';
import { useUnixTime } from '../model/use-unix-time';
import { BaseVestingLockRows } from './BaseVestingLockRows';

/** Account page rows for a `ClaimScheduleBucketV2`; callers check `isVestingLockAccount` first. */
export function VestingLockRows({ account }: { account: Account }) {
    const now = useUnixTime();
    const lock = account.data.raw && readVestingLock(account.data.raw, now);
    const mint = lock ? lock.mint : undefined;
    const mintInfo = useMintAccountInfo(mint);
    const mintFailed = useAccountInfo(mint)?.status === FetchStatus.FetchFailed;
    const fetchAccountInfo = useFetchAccountInfo();
    const fetchMint = () => mint && fetchAccountInfo(new PublicKey(mint), 'parsed');

    // `account` is a dependency so the card's Refresh, which reloads the lock, also retries a mint that failed.
    useEffect(() => {
        if (mint && !mintInfo) fetchAccountInfo(new PublicKey(mint), 'parsed');
    }, [fetchAccountInfo, mint, account]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!lock) return <></>;

    return (
        <>
            <KeyValueRows
                rows={[
                    { label: 'Address', value: <Address pubkey={account.pubkey} alignRight raw /> },
                    { label: 'Token Mint', value: <Address address={lock.mint} alignRight link /> },
                    { label: 'Genesis Account', value: <Address address={lock.genesis} alignRight link /> },
                    !mintInfo &&
                        mintFailed && {
                            label: 'Vesting',
                            value: (
                                <span className="flex items-baseline justify-end gap-3">
                                    Failed to load the token mint.
                                    <Button variant="ghost" size="inline" onClick={() => fetchMint()}>
                                        <RefreshCw size={14} />
                                        <span>Try Again</span>
                                    </Button>
                                </span>
                            ),
                        },
                ]}
            />
            {/* Amounts need the mint's decimals, so these rows appear once the mint account loads. */}
            {mintInfo && <BaseVestingLockRows lock={lock} decimals={mintInfo.decimals} />}
        </>
    );
}
