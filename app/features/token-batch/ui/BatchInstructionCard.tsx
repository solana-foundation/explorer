import { InstructionCardView, type InstructionNode, ProgramField } from '@entities/instruction-card';
import type { ReactNode } from 'react';

export function BatchInstructionCard({
    node,
    count,
    children,
}: {
    node: InstructionNode;
    count: number;
    children: ReactNode;
}) {
    return (
        <InstructionCardView node={node} title={batchInstructionTitle(count)} collapsible>
            <ProgramField programId={node.programId} />
            {children}
        </InstructionCardView>
    );
}

function batchInstructionTitle(count: number): string {
    return `Token Program: Batch (${count} instruction${count !== 1 ? 's' : ''})`;
}
