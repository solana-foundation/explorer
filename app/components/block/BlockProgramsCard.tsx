import { Address } from '@components/common/Address';
import { CollapsibleSection } from '@components/shared/ui/collapsible-section';
import type { BlockWithV1 } from '@entities/block-data';
import { PublicKey } from '@solana/web3.js';
import React from 'react';

import {
    CountWithPercent,
    GridHeaderRow,
    percentOf,
    type ResponsiveCell,
    ResponsiveGridRow,
    TIGHT_CARD,
} from '@/app/components/block/shared';
import { Label, Row, Value } from '@/app/components/shared/ui/detail-row';
import { invariant } from '@/app/shared/lib/invariant';
import { Card } from '@/app/shared/ui/Card';

type ProgramStats = {
    ixFrequency: Map<string, number>;
    programEntries: [string, number][];
    showSuccessRate: boolean;
    totalInstructions: number;
    totalTransactions: number;
    txSuccesses: Map<string, number>;
};

// Aggregates program usage across a block's transactions.
function computeProgramStats(block: BlockWithV1): ProgramStats {
    const totalTransactions = block.transactions.length;
    const txSuccesses = new Map<string, number>();
    const txFrequency = new Map<string, number>();
    const ixFrequency = new Map<string, number>();

    let totalInstructions = 0;
    block.transactions.forEach(tx => {
        const message = tx.transaction.message;
        totalInstructions += message.compiledInstructions.length;
        const programUsed = new Set<string>();
        const accountKeys = tx.transaction.message.getAccountKeys({
            accountKeysFromLookups: tx.meta?.loadedAddresses,
        });
        const trackProgram = (index: number) => {
            if (index >= accountKeys.length) return;
            const programId = accountKeys.get(index);
            invariant(programId, `account key index ${index} out of range`);
            const programAddress = programId.toBase58();
            programUsed.add(programAddress);
            const frequency = ixFrequency.get(programAddress);
            ixFrequency.set(programAddress, frequency ? frequency + 1 : 1);
        };

        message.compiledInstructions.forEach(ix => trackProgram(ix.programIdIndex));
        tx.meta?.innerInstructions?.forEach(inner => {
            totalInstructions += inner.instructions.length;
            inner.instructions.forEach(innerIx => trackProgram(innerIx.programIdIndex));
        });

        const successful = tx.meta?.err === null;
        programUsed.forEach(programId => {
            const frequency = txFrequency.get(programId);
            txFrequency.set(programId, frequency ? frequency + 1 : 1);
            if (successful) {
                const count = txSuccesses.get(programId);
                txSuccesses.set(programId, count ? count + 1 : 1);
            }
        });
    });

    const programEntries: [string, number][] = [];
    txFrequency.forEach((txFreq, programId) => {
        programEntries.push([programId, txFreq]);
    });

    programEntries.sort((a, b) => {
        if (a[1] < b[1]) return 1;
        if (a[1] > b[1]) return -1;
        return 0;
    });

    const showSuccessRate = block.transactions.every(tx => tx.meta !== null);
    return { ixFrequency, programEntries, showSuccessRate, totalInstructions, totalTransactions, txSuccesses };
}

export function BlockProgramsCard({ block }: { block: BlockWithV1 }) {
    const stats = computeProgramStats(block);

    // gap-6 (24px) between the two sections matches the spacing between instruction blocks on the
    // transaction page (each is a dashkit `CollapsibleCard` carrying the default `mb-6`).
    return (
        <div className="flex flex-col gap-6">
            <ProgramStatsCollapsible stats={stats} />
            <ProgramsCollapsible stats={stats} />
        </div>
    );
}

// "Block Program Stats" as overview-style label/value rows on a tight surface.
function ProgramStatsCollapsible({ stats }: { stats: ProgramStats }) {
    const rows: [string, number][] = [
        ['Unique Programs', stats.programEntries.length],
        ['Total Instructions', stats.totalInstructions],
    ];
    return (
        <CollapsibleSection title="Block Program Stats" collapsible={false} className="">
            <Card variant="tight" className={TIGHT_CARD}>
                {rows.map(([label, value], i) => (
                    <Row key={label} divider={i < rows.length - 1}>
                        <Label>{label}</Label>
                        <Value mono={false}>{value}</Value>
                    </Row>
                ))}
            </Card>
        </CollapsibleSection>
    );
}

// "Block Programs" as a CSS grid on md+, stacked labelled rows below md. Each figure shows its count
// with the percentage in parentheses ("count (percent)").
function ProgramsCollapsible({ stats }: { stats: ProgramStats }) {
    const { ixFrequency, programEntries, showSuccessRate, totalInstructions, totalTransactions, txSuccesses } = stats;

    // Program takes the slack; the count+percentage columns are a fixed 8.5rem track (wide enough for a
    // "count (percent)" pair), the single-value Success column narrower (5rem). Fixed (not `auto`) so the
    // header and each row resolve identical track widths. Inline so the Storybook JIT can't purge it.
    const gridStyle: React.CSSProperties = {
        gridTemplateColumns: `minmax(0,1fr) 8.5rem 8.5rem${showSuccessRate ? ' 5rem' : ''}`,
    };
    const txPctHelp = `Share of the block's ${totalTransactions.toLocaleString('en-US')} processed transactions that invoked this program.`;
    const ixPctHelp = `Share of the block's ${totalInstructions.toLocaleString('en-US')} total instructions that invoked this program.`;
    const successHelp = "Share of this program's transactions that succeeded (no error).";
    const headers: { label: string; help?: string }[] = [
        { label: 'Program' },
        { help: txPctHelp, label: 'Transactions' },
        { help: ixPctHelp, label: 'Instructions' },
    ];
    if (showSuccessRate) headers.push({ help: successHelp, label: 'Success' });

    return (
        <CollapsibleSection title="Block Programs" collapsible={false} className="">
            <Card variant="tight" className={TIGHT_CARD}>
                <div className="text-sm text-white">
                    <GridHeaderRow headers={headers} style={gridStyle} rightAlignFrom={1} />

                    {programEntries.map(([programId, txFreq]) => (
                        <ProgramRow
                            key={programId}
                            programId={programId}
                            txFreq={txFreq}
                            ixFreq={ixFrequency.get(programId) as number}
                            successes={txSuccesses.get(programId) || 0}
                            totalTransactions={totalTransactions}
                            totalInstructions={totalInstructions}
                            showSuccessRate={showSuccessRate}
                            gridStyle={gridStyle}
                        />
                    ))}
                </div>
            </Card>
        </CollapsibleSection>
    );
}

// One program's usage row: a CSS grid on md+, stacked labelled fields below md. Each figure pairs its
// count with a percentage — transactions/instructions as a share of the block, success as a share of
// the program's own transactions.
function ProgramRow({
    programId,
    txFreq,
    ixFreq,
    successes,
    totalTransactions,
    totalInstructions,
    showSuccessRate,
    gridStyle,
}: {
    programId: string;
    txFreq: number;
    ixFreq: number;
    successes: number;
    totalTransactions: number;
    totalInstructions: number;
    showSuccessRate: boolean;
    gridStyle: React.CSSProperties;
}) {
    const txPct = percentOf(txFreq, totalTransactions);
    const ixPct = percentOf(ixFreq, totalInstructions);
    const successRate = showSuccessRate ? percentOf(successes, txFreq, 0) : undefined;
    const cells: ResponsiveCell[] = [
        {
            children: <Address pubkey={new PublicKey(programId)} link />,
            desktopClassName: 'min-w-0',
            key: 'program',
            label: 'Program',
            mobileAlign: 'center',
        },
        {
            children: <CountWithPercent count={txFreq} percent={txPct} />,
            desktopClassName: 'text-right tabular-nums',
            key: 'transactions',
            label: 'Transactions',
            mobileAlign: 'center',
        },
        {
            children: <CountWithPercent count={ixFreq} percent={ixPct} />,
            desktopClassName: 'text-right tabular-nums',
            key: 'instructions',
            label: 'Instructions',
            mobileAlign: 'center',
        },
    ];
    if (successRate !== undefined) {
        cells.push({
            children: successRate,
            desktopClassName: 'text-right tabular-nums',
            key: 'success',
            label: 'Success',
            mobileAlign: 'center',
        });
    }

    return <ResponsiveGridRow cells={cells} gridStyle={gridStyle} />;
}
