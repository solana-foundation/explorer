import { InstructionCard } from '@components/instruction/InstructionCard';
import { useCluster } from '@providers/cluster';
import { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { getProgramName } from '@utils/tx';
import React from 'react';

// Card for instructions whose program we recognize but whose payload we don't decode; the caller supplies the resolved name.
export function CommonInstructionDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
    instructionName,
}: {
    ix: TransactionInstruction | ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: React.ReactNode[];
    childIndex?: number;
    instructionName: string;
}) {
    const { cluster } = useCluster();
    const programName = getProgramName(ix.programId.toBase58(), cluster);
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${programName}: ${instructionName}`}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw
        />
    );
}
