'use client';

import { useRawAccountData } from '@entities/account';
import { PublicKey } from '@solana/web3.js';

import { DownloadDropdown } from '@/app/shared/components/DownloadDropdown';

export function AccountDownloadDropdown({ pubkey, space }: { pubkey: PublicKey; space?: number }) {
    const [rawData, fetchRaw] = useRawAccountData(pubkey);

    if (space === 0) return null;

    return <DownloadDropdown data={rawData} filename={pubkey.toBase58()} onOpenChange={open => open && fetchRaw()} />;
}
