'use client';

import { useRawAccountData } from '@entities/account';
import { PublicKey } from '@solana/web3.js';

import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';

export function AccountDownloadDropdown({ pubkey, space }: { pubkey: PublicKey; space?: number }) {
    const address = pubkey.toBase58();
    const { data: rawData, error, mutate, isLoading } = useRawAccountData(address);

    if (space === 0) return null;

    return (
        <DownloadDropdown
            data={rawData}
            loading={isLoading}
            error={error}
            filename={address}
            onOpenChange={open => open && mutate()}
        />
    );
}
