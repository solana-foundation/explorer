import { parseInstruction } from '@codama/dynamic-parsers';
import { DecodedInstructionCard, parseCodamaArgs, useInstructionSurface } from '@entities/instruction-card';
import { TransactionInstruction } from '@solana/web3.js';
import { capitalizeFirstLetter } from '@utils/index';

import { UnknownDetailsCard } from '@/app/components/instruction/UnknownDetailsCard';

export function CodamaInstructionCard({
    ix,
    index,
    childIndex,
    innerCards,
    parsedIx,
}: {
    ix: TransactionInstruction;
    index: number;
    childIndex?: number;
    innerCards?: JSX.Element[];
    parsedIx: ReturnType<typeof parseInstruction>;
}) {
    const { result } = useInstructionSurface();
    const unknownCard = (
        <UnknownDetailsCard ix={ix} result={result} index={index} childIndex={childIndex} innerCards={innerCards} />
    );

    if (parsedIx?.path[0].kind !== 'rootNode') {
        return unknownCard;
    }
    const lastNode = parsedIx.path[parsedIx.path.length - 1];
    if (lastNode.kind !== 'instructionNode') {
        return unknownCard;
    }

    const programName = capitalizeFirstLetter(parsedIx.path[0].program.name);

    return (
        <DecodedInstructionCard
            node={{ childIndex, index, innerCards, ix, programId: ix.programId }}
            ix={ix}
            title={`${programName}: ${capitalizeFirstLetter(lastNode.name)}`}
            programName={programName}
            accountNames={parsedIx.accounts.map(account => account.name)}
            args={parseCodamaArgs(parsedIx.data)}
        />
    );
}
