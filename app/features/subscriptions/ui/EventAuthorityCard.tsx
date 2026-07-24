'use client';

import { KitAddress } from '@components/common/KitAddress';
import type { Account } from '@providers/accounts';
import type { Address } from '@solana/kit';

import { BaseAccountCard } from '@/app/shared/ui/BaseAccountCard';
import { BaseTable } from '@/app/shared/ui/Table';

import { SUBSCRIPTIONS_ADDRESS } from '../lib/constants';

/**
 * Info card for the Subscriptions program's event-authority PDA. This address is a
 * signer-only PDA that holds no account data, so there is nothing to decode — we
 * identify it by its derived address and link back to the program.
 */
export function SubscriptionsEventAuthorityCard({ account }: { account: Account }) {
    return (
        <BaseAccountCard title="Subscriptions Event Authority" showRawButton={false}>
            <BaseTable.Row>
                <BaseTable.Cell>Address</BaseTable.Cell>
                <BaseTable.Cell className="md:text-right">
                    <KitAddress address={account.pubkey.toBase58() as Address} raw alignRight />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Account Type</BaseTable.Cell>
                <BaseTable.Cell className="md:text-right">Event Authority (signer PDA)</BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="md:text-right">
                    <KitAddress address={SUBSCRIPTIONS_ADDRESS as Address} raw link alignRight />
                </BaseTable.Cell>
            </BaseTable.Row>
        </BaseAccountCard>
    );
}
