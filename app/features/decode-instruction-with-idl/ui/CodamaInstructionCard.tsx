import { parseInstruction } from '@codama/dynamic-parsers';
import {
    DecodedInstructionCard,
    parseCodamaArgs,
    type RawInstructionNode,
    UnknownDetailsCard,
} from '@entities/instruction-card';
import { capitalizeFirstLetter } from '@utils/index';

export function CodamaInstructionCard({
    node,
    parsedIx,
}: {
    node: RawInstructionNode;
    parsedIx: ReturnType<typeof parseInstruction>;
}) {
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
            title={`${programName}: ${capitalizeFirstLetter(lastNode.name)}`}
            programName={programName}
            accountNames={parsedIx.accounts.map(account => account.name)}
            args={parseCodamaArgs(parsedIx.data)}
        />
    );
}
