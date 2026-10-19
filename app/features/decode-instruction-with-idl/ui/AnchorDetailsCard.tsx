import { Idl, Program } from '@coral-xyz/anchor';
import { InstructionCardView, type InstructionNode, ProgramField } from '@entities/instruction-card';
import { TransactionInstruction } from '@solana/web3.js';

import { type AnchorInstructionDecoded } from '../lib/decode-anchor-instruction';
import { useAnchorEvents } from '../model/use-anchor-events';
import { AnchorInstructionBody } from './AnchorInstructionBody';
import { ProgramEventsCard } from './ProgramEventsCard';

export function AnchorDetailsCard({
    node,
    ix,
    program,
    decoded,
}: {
    node: InstructionNode;
    ix: TransactionInstruction;
    program: Program<Idl>;
    decoded: AnchorInstructionDecoded;
}) {
    const entries = useAnchorEvents(node, program);
    const events =
        entries.length > 0
            ? [
                  <ProgramEventsCard
                      key="events"
                      entries={entries}
                      program={program}
                      instructionIndex={node.index}
                      childIndex={node.childIndex}
                  />,
              ]
            : undefined;

    return (
        <InstructionCardView node={node} title={decoded.cardTitle} events={events}>
            <ProgramField programId={node.programId} name={decoded.programName} colSpan={2} />
            <AnchorInstructionBody ix={ix} idl={program.idl} decoded={decoded} />
        </InstructionCardView>
    );
}
