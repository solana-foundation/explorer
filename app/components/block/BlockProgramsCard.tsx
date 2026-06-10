import { Address } from '@components/common/Address';
import { TableCardBody } from '@components/common/TableCardBody';
import { PublicKey, VersionedBlockResponse } from '@solana/web3.js';
import React from 'react';

import { invariant } from '@/app/shared/lib/invariant';
import { Card, CardHeader, CardTitle } from '@/app/shared/ui/Card';
import { BaseTable } from '@/app/shared/ui/Table';

export function BlockProgramsCard({ block }: { block: VersionedBlockResponse }) {
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
    return (
        <>
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit">
                        Block Program Stats
                    </CardTitle>
                </CardHeader>
                <TableCardBody>
                    <BaseTable.Row>
                        <BaseTable.Cell className="e-w-full">Unique Programs Count</BaseTable.Cell>
                        <BaseTable.Cell className="font-monospace e-text-right">{programEntries.length}</BaseTable.Cell>
                    </BaseTable.Row>
                    <BaseTable.Row>
                        <BaseTable.Cell className="e-w-full">Total Instructions</BaseTable.Cell>
                        <BaseTable.Cell className="font-monospace e-text-right">{totalInstructions}</BaseTable.Cell>
                    </BaseTable.Row>
                </TableCardBody>
            </Card>
            <Card ui="dashkit">
                <CardHeader ui="dashkit">
                    <CardTitle as="h3" ui="dashkit">
                        Block Programs
                    </CardTitle>
                </CardHeader>
                <BaseTable ui="dashkit" variant="card" nowrap>
                    <BaseTable.Head>
                        <BaseTable.Row>
                            <BaseTable.HeaderCell className="e-text-dk-gray-700">Program</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="e-text-dk-gray-700">Transaction Count</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="e-text-dk-gray-700">% of Total</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="e-text-dk-gray-700">Instruction Count</BaseTable.HeaderCell>
                            <BaseTable.HeaderCell className="e-text-dk-gray-700">% of Total</BaseTable.HeaderCell>
                            {showSuccessRate && (
                                <BaseTable.HeaderCell className="e-text-dk-gray-700">Success Rate</BaseTable.HeaderCell>
                            )}
                        </BaseTable.Row>
                    </BaseTable.Head>
                    <BaseTable.Body>
                        {programEntries.map(([programId, txFreq]) => {
                            const ixFreq = ixFrequency.get(programId) as number;
                            const successes = txSuccesses.get(programId) || 0;
                            return (
                                <BaseTable.Row key={programId}>
                                    <BaseTable.Cell>
                                        <Address pubkey={new PublicKey(programId)} link />
                                    </BaseTable.Cell>
                                    <BaseTable.Cell>{txFreq}</BaseTable.Cell>
                                    <BaseTable.Cell>{((100 * txFreq) / totalTransactions).toFixed(2)}%</BaseTable.Cell>
                                    <BaseTable.Cell>{ixFreq}</BaseTable.Cell>
                                    <BaseTable.Cell>{((100 * ixFreq) / totalInstructions).toFixed(2)}%</BaseTable.Cell>
                                    {showSuccessRate && (
                                        <BaseTable.Cell>{((100 * successes) / txFreq).toFixed(0)}%</BaseTable.Cell>
                                    )}
                                </BaseTable.Row>
                            );
                        })}
                    </BaseTable.Body>
                </BaseTable>
            </Card>
        </>
    );
}
