// Shared shell for the two batch-instruction cards: the raw-decode path
// (TokenBatchCard) and the RPC-parsed path (RpcParsedTokenBatchCard). Keeps the
// title format and table frame in one place so the two paths can't drift.

import { InstructionCard } from '@components/instruction/InstructionCard';
import type { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import type { ReactNode } from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

export function BatchInstructionCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
    count,
    children,
}: {
    ix: TransactionInstruction | ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: ReactNode[];
    childIndex?: number;
    count: number;
    children: ReactNode;
}) {
    return (
        <InstructionCard
            title={batchInstructionTitle(count)}
            collapsible
            {...{ childIndex, index, innerCards, ix, result }}
        >
            <BaseTable.Row>
                <BaseTable.Cell colSpan={3} className="p-0">
                    <div className="pb-2">{children}</div>
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}

function batchInstructionTitle(count: number): string {
    return `Token Program: Batch (${count} instruction${count !== 1 ? 's' : ''})`;
}
