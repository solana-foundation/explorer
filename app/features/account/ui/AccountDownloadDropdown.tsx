'use client';

import { useLazyRawAccountData } from '@entities/account';
import { PublicKey } from '@solana/web3.js';

import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';

// FIXME: missing Storybook story — needs useLazyRawAccountData SWR mock + useConnection.
export function AccountDownloadDropdown({ pubkey, space }: { pubkey: PublicKey; space?: number }) {
    const address = pubkey.toBase58();
    const { data: rawData, error, load, loading } = useLazyRawAccountData(address);

    if (space === 0) return null;

    return (
        <DownloadDropdown
            data={rawData}
            loading={loading}
            error={error}
            filename={address}
            onOpenChange={open => open && load()}
        />
    );
}
