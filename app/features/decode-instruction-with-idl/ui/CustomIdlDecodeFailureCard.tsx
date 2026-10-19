import {
    DECODED_TABLE_COLUMNS,
    type InstructionNode,
    ProgramField,
    UnknownDetailsCard,
} from '@entities/instruction-card';

import { BaseTable } from '@/app/shared/ui/Table';

export function CustomIdlDecodeFailureCard({ node }: { node: InstructionNode }) {
    return (
        <UnknownDetailsCard node={node}>
            <ProgramField programId={node.programId} colSpan={DECODED_TABLE_COLUMNS - 1} />
            <BaseTable.Row>
                <BaseTable.Cell colSpan={DECODED_TABLE_COLUMNS}>
                    The custom IDL could not decode this instruction.
                </BaseTable.Cell>
            </BaseTable.Row>
        </UnknownDetailsCard>
    );
}
