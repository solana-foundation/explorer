'use client';

import { Address } from '@components/common/Address';
import { type Account, useFetchAccountInfo, useMintAccountInfo } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { useEffect } from 'react';

import { KeyValueRows } from '@/app/shared/ui/key-value';

import { readVestingLock } from '../lib/read-vesting-lock';
import { BaseVestingLockRows } from './BaseVestingLockRows';

/** Account page rows for a `ClaimScheduleBucketV2`; callers check `isVestingLockAccount` first. */
export function VestingLockRows({ account }: { account: Account }) {
    const lock = account.data.raw && readVestingLock(account.data.raw, Math.floor(Date.now() / 1000));
    const mint = lock ? lock.mint : undefined;
    const mintInfo = useMintAccountInfo(mint);
    const fetchAccountInfo = useFetchAccountInfo();

    useEffect(() => {
        if (mint && !mintInfo) fetchAccountInfo(new PublicKey(mint), 'parsed');
    }, [fetchAccountInfo, mint]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!lock) return <></>;

    return (
        <>
            <KeyValueRows
                rows={[
                    { label: 'Address', value: <Address pubkey={account.pubkey} alignRight raw /> },
                    { label: 'Token Mint', value: <Address address={lock.mint} alignRight link /> },
                    { label: 'Genesis Account', value: <Address address={lock.genesis} alignRight link /> },
                ]}
            />
            {/* Amounts need the mint's decimals, so these rows appear once the mint account loads. */}
            {mintInfo && <BaseVestingLockRows lock={lock} decimals={mintInfo.decimals} />}
        </>
    );
}
