import { InstructionCardView, type InstructionNode, ProgramField } from '@entities/instruction-card';
import type { ReactNode } from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

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
            <BaseTable.Row>
                <BaseTable.Cell colSpan={3} className="p-0">
                    <div className="pb-2">{children}</div>
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCardView>
    );
}

function batchInstructionTitle(count: number): string {
    return `Token Program: Batch (${count} instruction${count !== 1 ? 's' : ''})`;
}
