import { Idl, Program } from '@coral-xyz/anchor';
import {
    DecodedInstructionCard,
    InstructionCardView,
    InstructionFieldRows,
    ProgramField,
    type RawInstructionNode,
    text,
} from '@entities/instruction-card';
import { anchorInstructionArgs } from '@utils/anchor';

import { anchorAccountNames } from '../lib/anchor-account-names';
import { type AnchorInstructionDecoded } from '../lib/decode-anchor-instruction';
import { useAnchorEvents } from '../model/use-anchor-events';

export function AnchorDetailsCard({
    node,
    program,
    decoded,
}: {
    node: RawInstructionNode;
    program: Program<Idl>;
    decoded: AnchorInstructionDecoded;
}) {
    const events = useAnchorEvents(node, program);
    const { decodedIxData, ixAccounts, ixDef } = decoded;

    if (!ixAccounts || !decodedIxData || !ixDef) {
        return (
            <InstructionCardView node={node} title={decoded.cardTitle} events={events}>
                <ProgramField programId={node.programId} name={decoded.programName} />
                <InstructionFieldRows
                    fields={[text('Error', 'Failed to decode account data according to the public Anchor interface')]}
                />
            </InstructionCardView>
        );
    }

    return (
        <DecodedInstructionCard
            node={node}
            title={decoded.cardTitle}
            programName={decoded.programName}
            accountNames={anchorAccountNames(ixAccounts)}
            args={anchorInstructionArgs(decodedIxData.data, ixDef, program.idl)}
            events={events}
        />
    );
}
