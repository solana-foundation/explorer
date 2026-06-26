import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { TableCardBody } from '@components/common/TableCardBody';
import { Account } from '@providers/accounts';
import { PublicKey } from '@solana/web3.js';
import { generated } from '@sqds/multisig';
import Link from 'next/link';
import React from 'react';
import { Search } from 'react-feather';

import { Button } from '@/app/components/shared/ui/button';
import { SQUADS_V4_ADDRESS } from '@/app/providers/squadsMultisig';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';
import { useClusterPath } from '@/app/utils/url';

const { batchDiscriminator, vaultTransactionDiscriminator } = generated;

export type SquadsAccountType = 'batch' | 'vaultTransaction';

/**
 * Identify a Squads v4 Batch or VaultTransaction account from its owner + the 8-byte
 * account discriminator, so the address page can offer a direct "Inspect" link instead
 * of falling back to the generic Unknown Account card. Both are accepted by the
 * inspector's `squadsTx` param.
 */
export function detectSquadsAccountType(owner: PublicKey, rawData: Uint8Array): SquadsAccountType | undefined {
    if (owner.toBase58() !== SQUADS_V4_ADDRESS || rawData.length < 8) return undefined;
    const matches = (discriminator: number[]) => discriminator.every((byte, i) => byte === rawData[i]);
    if (matches(batchDiscriminator)) return 'batch';
    if (matches(vaultTransactionDiscriminator)) return 'vaultTransaction';
    return undefined;
}

export function SquadsAccountSection({ account, accountType }: { account: Account; accountType: SquadsAccountType }) {
    const inspectorPath = useClusterPath({
        additionalParams: new URLSearchParams({ squadsTx: account.pubkey.toBase58() }),
        pathname: '/tx/inspector',
    });
    const label = accountType === 'batch' ? 'Squads Batch' : 'Squads Vault Transaction';

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit" className="gap-2">
                <CardTitle as="h3" ui="dashkit" className="flex items-center">
                    {label}
                </CardTitle>
                <Button ui="dashkit" variant="primary" size="sm" asChild>
                    <Link href={inspectorPath}>
                        <Search className="mr-1.5 align-text-top" size={13} />
                        Inspect
                    </Link>
                </Button>
            </CardHeader>

            <TableCardBody>
                <BaseTable.Row>
                    <BaseTable.Cell>Address</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={account.pubkey} alignRight raw />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Balance (SOL)</BaseTable.Cell>
                    <BaseTable.Cell className="text-right uppercase">
                        <SolBalance lamports={account.lamports} />
                    </BaseTable.Cell>
                </BaseTable.Row>
                <BaseTable.Row>
                    <BaseTable.Cell>Owner</BaseTable.Cell>
                    <BaseTable.Cell className="text-right">
                        <Address pubkey={account.owner} alignRight link />
                    </BaseTable.Cell>
                </BaseTable.Row>
            </TableCardBody>
        </Card>
    );
}
