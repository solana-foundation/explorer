import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import Link from 'next/link';
import React from 'react';
import { Search } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { SQUADS_V4_ADDRESS } from '@/app/providers/squadsMultisig';
import { type KeyValueRow, KeyValueRows } from '@/app/shared/ui/key-value';
import { OverviewCard } from '@/app/shared/ui/OverviewCard';
import { useClusterPath } from '@/app/utils/url';

// Copies of the Squads SDK discriminators, so the account page detects these accounts without loading heavy SDK.
const BATCH_DISCRIMINATOR = [156, 194, 70, 44, 22, 88, 137, 44];
const VAULT_TRANSACTION_DISCRIMINATOR = [168, 250, 162, 100, 81, 14, 162, 207];

export type SquadsAccountType = 'batch' | 'vaultTransaction';

export function detectSquadsAccountType(owner: PublicKey, rawData: Uint8Array): SquadsAccountType | undefined {
    if (owner.toBase58() !== SQUADS_V4_ADDRESS || rawData.length < 8) return undefined;
    const matches = (discriminator: number[]) => discriminator.every((byte, i) => byte === rawData[i]);
    if (matches(BATCH_DISCRIMINATOR)) return 'batch';
    if (matches(VAULT_TRANSACTION_DISCRIMINATOR)) return 'vaultTransaction';
    return undefined;
}

export function SquadsAccountSection({ account, accountType }: { account: Account; accountType: SquadsAccountType }) {
    const inspectorPath = useClusterPath({
        additionalParams: new URLSearchParams({ squadsTx: account.pubkey.toBase58() }),
        pathname: '/tx/inspector',
    });
    const label = accountType === 'batch' ? 'Squads Batch' : 'Squads Vault Transaction';

    const rows: KeyValueRow[] = [
        { label: 'Address', value: <Address pubkey={account.pubkey} raw /> },
        { label: 'Balance (SOL)', value: <SolBalance lamports={account.lamports} />, valueClassName: 'uppercase' },
        { label: 'Owner', value: <Address pubkey={account.owner} link /> },
    ];

    return (
        <OverviewCard
            title={label}
            actions={
                <Button ui="dashkit" variant="primary" size="sm" asChild>
                    <Link href={inspectorPath}>
                        <Search className="mr-1.5 align-text-top" size={13} />
                        Inspect
                    </Link>
                </Button>
            }
        >
            <KeyValueRows rows={rows} />
        </OverviewCard>
    );
}
