import { useCluster } from '@providers/cluster';
import { ComputeBudgetProgram, MessageCompiledInstruction, VersionedMessage } from '@solana/web3.js';
import { getProgramName } from '@utils/tx';
import React from 'react';

import { useAnchorProgram } from '@/app/providers/anchor';

import { BaseInstructionCard } from '../common/BaseInstructionCard';
import AnchorDetailsCard from '../instruction/AnchorDetailsCard';
import { ComputeBudgetDetailsCard } from '../instruction/ComputeBudgetDetailsCard';
import { UnknownDetailsCard } from './UnknownDetailsCard';
import { intoTransactionInstructionFromVersionedMessage } from './utils';

export function InstructionsSection({ message }: { message: VersionedMessage }) {
    return (
        <>
            {message.compiledInstructions.map((ix, index) => {
                return <InspectorInstructionCard key={index} {...{ index, ix, message }} />;
            })}
        </>
    );
}

function InspectorInstructionCard({
    message,
    ix,
    index,
}: {
    message: VersionedMessage;
    ix: MessageCompiledInstruction;
    index: number;
}) {
    const { cluster, url } = useCluster();
    const programId = message.staticAccountKeys[ix.programIdIndex];
    const programName = getProgramName(programId.toBase58(), cluster);
    const anchorProgram = useAnchorProgram(programId.toString(), url);

    const transactionInstruction = intoTransactionInstructionFromVersionedMessage(ix, message, programId);

    if (anchorProgram.program) {
        return AnchorDetailsCard({
            anchorProgram: anchorProgram.program,
            childIndex: undefined,
            index: index,
            // Inner cards and child are not used since we do not know what CPIs
            // will be called until simulation happens, and even then, all we
            // get is logs, not the TransactionInstructions
            innerCards: undefined,
            ix: transactionInstruction,
            // Always display success since it is too complicated to determine
            // based on the simulation and pass that result here. Could be added
            // later if desired, possibly similar to innerCards from parsing tx
            // sim logs.
            result: { err: null },
            // Signature is not needed.
            signature: '',
        });
    }

    /// Handle program-specific cards here
    //  - keep signature (empty string as we do not submit anything) for backward compatibility with the data from Transaction
    //  - result is `err: null` as at this point there should not be errors
    const result = { err: null };
    const signature = '';
    switch (transactionInstruction?.programId.toString()) {
        case ComputeBudgetProgram.programId.toString(): {
            return (
                <ComputeBudgetDetailsCard
                    key={index}
                    ix={transactionInstruction}
                    index={index}
                    result={result}
                    signature={signature}
                    InstructionCardComponent={BaseInstructionCard}
                />
            );
        }
        default: {
            // unknown program; allow to render the next card
        }
    }

    return <UnknownDetailsCard key={index} index={index} ix={ix} message={message} programName={programName} />;
}
