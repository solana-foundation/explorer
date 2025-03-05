import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { useCluster } from '@providers/cluster';
import { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import { getProgramName } from '@utils/tx';
import React from 'react';

export function BaseUnknownDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
    InstructionCardComponent = BaseInstructionCard,
}: {
    ix: TransactionInstruction | ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
    InstructionCardComponent?: React.FC<Parameters<typeof BaseInstructionCard>[0]>;
}) {
    const { cluster } = useCluster();
    const programName = getProgramName(ix.programId.toBase58(), cluster);
    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            result={result}
            title={`${programName}: Unknown Instruction`}
            innerCards={innerCards}
            childIndex={childIndex}
            defaultRaw
        />
    );
}
