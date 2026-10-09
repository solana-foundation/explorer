import { parseInstruction } from '@codama/dynamic-parsers';
import {
    DecodedInstructionCard,
    parseCodamaArgs,
    toInstructionNode,
    UnknownDetailsCard,
} from '@entities/instruction-card';
import { TransactionInstruction } from '@solana/web3.js';
import { capitalizeFirstLetter } from '@utils/index';

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
    const node = toInstructionNode({ childIndex, index, innerCards, ix });

    if (parsedIx?.path[0].kind !== 'rootNode') {
        return <UnknownDetailsCard node={node} />;
    }
    const lastNode = parsedIx.path[parsedIx.path.length - 1];
    if (lastNode.kind !== 'instructionNode') {
        return <UnknownDetailsCard node={node} />;
    }

    const programName = capitalizeFirstLetter(parsedIx.path[0].program.name);

    return (
        <DecodedInstructionCard
            node={node}
            ix={ix}
            title={`${programName}: ${capitalizeFirstLetter(lastNode.name)}`}
            programName={programName}
            accountNames={parsedIx.accounts.map(account => account.name)}
            args={parseCodamaArgs(parsedIx.data)}
        />
    );
}
