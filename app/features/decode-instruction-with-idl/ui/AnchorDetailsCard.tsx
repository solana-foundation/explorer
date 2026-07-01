import { Idl, Program } from '@coral-xyz/anchor';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';

import { InstructionCard } from '@/app/components/instruction/InstructionCard';
import { ProgramEventsCard } from '@/app/components/instruction/ProgramEventsCard';

import { type AnchorInstructionDecoded } from '../lib/decode-anchor-instruction';
import { useAnchorEventPayloads } from '../model/use-anchor-event-payloads';
import { AnchorInstructionBody } from './AnchorInstructionBody';

/**
 * Presentational card for an Anchor instruction already decoded by `decodeInstructionWithIdl` (the
 * `kind: 'anchor'` fallback). It renders the title + rich body from `decoded` and attaches event cards;
 * it performs no decoding itself. `program` is kept only for its `idl` (argument rows) and for event
 * decoding from the transaction logs.
 */
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
    // Events live in the transaction logs (tx page only); the inspector passes an empty signature → none.
    const eventPayloads = useAnchorEventPayloads({ index, signature });
    const eventCards = eventPayloads && [
        <ProgramEventsCard key="events" eventPayloads={eventPayloads} program={program} instructionIndex={index} />,
    ];

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
