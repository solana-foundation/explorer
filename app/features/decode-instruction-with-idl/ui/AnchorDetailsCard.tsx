import { Idl, Program } from '@coral-xyz/anchor';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { InstructionCard } from '@/app/components/instruction/InstructionCard';

import { type AnchorInstructionDecoded } from '../lib/decode-anchor-instruction';
import { useAnchorEvents } from '../model/use-anchor-events';
import { AnchorInstructionBody } from './AnchorInstructionBody';
import { ProgramEventsCard } from './ProgramEventsCard';

export function AnchorDetailsCard({
    ix,
    index,
    result,
    signature,
    innerCards,
    childIndex,
    program,
    decoded,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    signature: string;
    innerCards?: JSX.Element[];
    childIndex?: number;
    program: Program<Idl>;
    decoded: AnchorInstructionDecoded;
}) {
    const entries = useAnchorEvents({ childIndex, index, signature }, program);
    const eventCards =
        entries.length > 0
            ? [
                  <ProgramEventsCard
                      key="events"
                      entries={entries}
                      program={program}
                      instructionIndex={index}
                      childIndex={childIndex}
                  />,
              ]
            : undefined;

    return (
        <InstructionCard
            title={decoded.cardTitle}
            ix={ix}
            index={index}
            result={result}
            innerCards={innerCards}
            childIndex={childIndex}
            eventCards={eventCards}
        >
            <AnchorInstructionBody
                ix={ix}
                idl={program.idl}
                programName={decoded.programName}
                ixAccounts={decoded.ixAccounts}
                decodedIxData={decoded.decodedIxData}
                ixDef={decoded.ixDef}
            />
        </InstructionCard>
    );
}
