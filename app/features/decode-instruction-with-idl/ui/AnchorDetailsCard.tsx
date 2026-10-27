import { Idl, Program } from '@coral-xyz/anchor';
import { InstructionCardView, ProgramField, type RawInstructionNode } from '@entities/instruction-card';

import { type AnchorInstructionDecoded } from '../lib/decode-anchor-instruction';
import { useAnchorEvents } from '../model/use-anchor-events';
import { AnchorInstructionBody } from './AnchorInstructionBody';
import { ProgramEventsCard } from './ProgramEventsCard';

export function AnchorDetailsCard({
    node,
    program,
    decoded,
}: {
    node: RawInstructionNode;
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
            <AnchorInstructionBody
                ix={node.raw}
                idl={program.idl}
                ixAccounts={decoded.ixAccounts}
                decodedIxData={decoded.decodedIxData}
                ixDef={decoded.ixDef}
            />
        </InstructionCardView>
    );
}
