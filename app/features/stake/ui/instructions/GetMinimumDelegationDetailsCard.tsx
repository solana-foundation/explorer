import { InstructionCardView, InstructionFields, type InstructionNode } from '@entities/instruction-card';

/** Hand-written: this instruction decodes to no payload, so the card factory has nothing to take. */
export function GetMinimumDelegationDetailsCard({ node }: { node: InstructionNode }) {
    return (
        <InstructionCardView node={node} title="Stake Program: Get Minimum Delegation">
            {/* Empty list — the Program row comes from the surface, not from a field. */}
            <InstructionFields fields={[]} programId={node.programId} />
        </InstructionCardView>
    );
}
