import { Address } from '@components/common/Address';
import { PublicKey, VersionedBlockResponse } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React from 'react';

import { Button } from '@/app/components/shared/ui/button';
import { invariant } from '@/app/shared/lib/invariant';
import { Card, CardFooter, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

type AccountStats = {
    reads: number;
    writes: number;
};

const PAGE_SIZE = 25;

export function BlockAccountsCard({ block, blockSlot }: { block: VersionedBlockResponse; blockSlot: number }) {
    const [numDisplayed, setNumDisplayed] = React.useState(10);
    const totalTransactions = block.transactions.length;

    const accountStats = React.useMemo(() => {
        const statsMap = new Map<string, AccountStats>();
        block.transactions.forEach(tx => {
            const message = tx.transaction.message;
            const txSet = new Map<string, boolean>();
            const accountKeys = message.getAccountKeys({
                accountKeysFromLookups: tx.meta?.loadedAddresses,
            });
            message.compiledInstructions.forEach(ix => {
                ix.accountKeyIndexes.forEach(index => {
                    const accountKey = accountKeys.get(index);
                    invariant(accountKey, `account key index ${index} out of range`);
                    const address = accountKey.toBase58();
                    txSet.set(address, message.isAccountWritable(index));
                });
            });

            txSet.forEach((isWritable, address) => {
                const stats = statsMap.get(address) || { reads: 0, writes: 0 };
                if (isWritable) {
                    stats.writes++;
                } else {
                    stats.reads++;
                }
                statsMap.set(address, stats);
            });
        });

        const accountEntries: [string, AccountStats][] = [];
        statsMap.forEach((value, key) => {
            accountEntries.push([key, value]);
        });

        accountEntries.sort((a, b) => {
            const aCount = a[1].reads + a[1].writes;
            const bCount = b[1].reads + b[1].writes;
            if (aCount < bCount) return 1;
            if (aCount > bCount) return -1;
            return 0;
        });

        return accountEntries;
    }, [block]);

    return (
        <Card ui="dashkit">
            <CardHeader ui="dashkit">
                <CardTitle as="h3" ui="dashkit">
                    Block Account Usage
                </CardTitle>
            </CardHeader>
            <BaseTable ui="dashkit" variant="card" nowrap>
                <BaseTable.Head>
                    <BaseTable.Row>
                        <BaseTable.HeaderCell className="e-text-dk-gray-700">Account</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="e-text-dk-gray-700">Read-Write Count</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="e-text-dk-gray-700">Read-Only Count</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="e-text-dk-gray-700">Total Count</BaseTable.HeaderCell>
                        <BaseTable.HeaderCell className="e-text-dk-gray-700">% of Transactions</BaseTable.HeaderCell>
                    </BaseTable.Row>
                </BaseTable.Head>
                <BaseTable.Body>
                    {accountStats.slice(0, numDisplayed).map(([address, { writes, reads }]) => (
                        <StatsRow
                            address={address}
                            blockSlot={blockSlot}
                            key={address}
                            reads={reads}
                            totalTransactions={totalTransactions}
                            writes={writes}
                        />
                    ))}
                </BaseTable.Body>
            </BaseTable>

            {accountStats.length > numDisplayed && (
                <CardFooter ui="dashkit">
                    <Button
                        ui="dashkit"
                        variant="primary"
                        className="e-w-full"
                        onClick={() => setNumDisplayed(displayed => displayed + PAGE_SIZE)}
                    >
                        Load More
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}

function StatsRow({
    address,
    blockSlot,
    writes,
    reads,
    totalTransactions,
}: {
    address: string;
    blockSlot: number;
    writes: number;
    reads: number;
    totalTransactions: number;
}) {
    const accountPath = useClusterPath({
        additionalParams: new URLSearchParams(`accountFilter=${address}&filter=all`),
        pathname: `/block/${blockSlot}`,
    });
    return (
        <BaseTable.Row>
            <BaseTable.Cell>
                <Link href={accountPath}>
                    <Address pubkey={new PublicKey(address)} />
                </Link>
            </BaseTable.Cell>
            <BaseTable.Cell>{writes}</BaseTable.Cell>
            <BaseTable.Cell>{reads}</BaseTable.Cell>
            <BaseTable.Cell>{writes + reads}</BaseTable.Cell>
            <BaseTable.Cell>{((100 * (writes + reads)) / totalTransactions).toFixed(2)}%</BaseTable.Cell>
        </BaseTable.Row>
    );
}
