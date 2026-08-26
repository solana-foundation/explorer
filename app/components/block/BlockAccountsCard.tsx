import { Address } from '@components/common/Address';
import type { BlockWithV1 } from '@entities/block-data';
import { PublicKey } from '@solana/web3.js';
import { useClusterPath } from '@utils/url';
import Link from 'next/link';
import React from 'react';

import {
    BracketedFigure,
    GridHeaderRow,
    LabeledField,
    LoadMoreButton,
    TIGHT_CARD,
} from '@/app/components/block/shared';
import { CollapsibleSection } from '@/app/features/transaction/ui/CollapsibleSection';
import { invariant } from '@/app/shared/lib/invariant';
import { Card } from '@/app/shared/ui/Card';

type AccountStats = {
    reads: number;
    writes: number;
};

const PAGE_SIZE = 25;

// Account takes the slack; the numeric columns are capped. The last column pairs Total with its % of
// transactions in one wider track. Header + rows share this template so columns stay aligned. Inline
// (not a `grid-cols-[…]` class) so the Storybook JIT can't purge it.
const ACCOUNTS_GRID: React.CSSProperties = {
    gridTemplateColumns: 'minmax(0,1fr) repeat(2, minmax(auto,5rem)) minmax(auto,8.5rem)',
};

export function BlockAccountsCard({ block, blockSlot }: { block: BlockWithV1; blockSlot: number }) {
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

    const visible = accountStats.slice(0, numDisplayed);
    const hasMore = accountStats.length > numDisplayed;

    // Header "Total" carries its % in the cells, not the header, but gets an info icon explaining it.
    const totalHelp = `Share of the block's ${totalTransactions.toLocaleString('en-US')} processed transactions that used this account.`;
    const headers: { label: string; help?: string }[] = [
        { label: 'Account' },
        { label: 'Read-Write' },
        { label: 'Read-Only' },
        { help: totalHelp, label: 'Total' },
    ];

    return (
        <CollapsibleSection title="Block Account Usage" className="">
            <Card variant="tight" className={TIGHT_CARD}>
                <div className="text-sm text-white">
                    <GridHeaderRow headers={headers} style={ACCOUNTS_GRID} rightAlignFrom={1} />

                    {visible.map(([address, stats]) => (
                        <AccountsGridRow
                            address={address}
                            blockSlot={blockSlot}
                            key={address}
                            reads={stats.reads}
                            totalTransactions={totalTransactions}
                            writes={stats.writes}
                        />
                    ))}

                    {hasMore && <LoadMoreButton onClick={() => setNumDisplayed(displayed => displayed + PAGE_SIZE)} />}
                </div>
            </Card>
        </CollapsibleSection>
    );
}

function AccountsGridRow({
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
    const total = writes + reads;
    const totalPct = `${((100 * total) / totalTransactions).toFixed(2)}%`;
    const plainFields = [
        { label: 'Read-Write', value: `${writes}` },
        { label: 'Read-Only', value: `${reads}` },
    ];
    const accountLink = (
        <Link href={accountPath} className="block min-w-0">
            <Address pubkey={new PublicKey(address)} />
        </Link>
    );
    return (
        <div className="border-b border-solid border-white/10 last:border-b-0">
            <div className="flex flex-col gap-1 px-3 py-3 md:hidden md:px-4">
                <LabeledField label="Account">{accountLink}</LabeledField>
                {plainFields.map((f, i) => (
                    <LabeledField key={i} label={f.label}>
                        {f.value}
                    </LabeledField>
                ))}
                <LabeledField label="Total">
                    {total}
                    <span className="text-outer-space-300"> ({totalPct})</span>
                </LabeledField>
            </div>

            <div style={ACCOUNTS_GRID} className="hidden items-start gap-5 px-3 py-2.5 md:grid md:px-4">
                <div className="min-w-0">{accountLink}</div>
                {plainFields.map((f, i) => (
                    <div key={i} className="text-right">
                        {f.value}
                    </div>
                ))}
                <BracketedFigure count={`${total}`} percent={totalPct} />
            </div>
        </div>
    );
}
