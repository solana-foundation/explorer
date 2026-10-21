'use client';

import { KitAddress } from '@components/common/KitAddress';
import type { Account } from '@providers/accounts';
import type { Address } from '@solana/kit';

import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';

import { SUBSCRIPTIONS_ADDRESS } from '../lib/constants';

export function SubscriptionsEventAuthorityCard({ account }: { account: Account }) {
    const rows: KeyValueRow[] = [
        { label: 'Address', value: <KitAddress address={account.pubkey.toBase58() as Address} raw /> },
        { label: 'Account Type', value: 'Event Authority (signer PDA)' },
        { label: 'Program', value: <KitAddress address={SUBSCRIPTIONS_ADDRESS as Address} raw link /> },
    ];
    return (
        <OverviewCard title="Subscriptions Event Authority">
            <KeyValueRows rows={rows} />
        </OverviewCard>
    );
}
