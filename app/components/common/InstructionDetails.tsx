import { isTokenProgramData } from '@providers/accounts';
import { ConfirmedSignatureInfo } from '@solana/web3.js';
import { getTokenProgramInstructionName, InstructionType } from '@utils/instruction';
import React from 'react';
import { MinusSquare, PlusSquare } from 'react-feather';

// Tree connector lines ported from dashkit `.tree`: ::before draws the elbow, the left border the spine (dropped on the last row, which corners its ::before instead); `thin` ≡ 1px, em units keep it text-relative.
const treeItemClass =
    "ml-[0.35em] border-0 border-l border-solid border-[#808080] last:border-l-0 before:inline-block before:h-[0.6em] before:w-[1.4em] before:mr-[0.1em] before:align-top before:border-0 before:border-b before:border-solid before:border-[#808080] before:content-[''] last:before:border-l";

export function InstructionDetails({
    instructionType,
    tx,
    defaultExpanded = false,
}: {
    instructionType: InstructionType;
    tx: ConfirmedSignatureInfo;
    defaultExpanded?: boolean;
}) {
    const [expanded, setExpanded] = React.useState(defaultExpanded);

    const instructionTypes = instructionType.innerInstructions
        .map(ix => {
            if ('parsed' in ix && isTokenProgramData(ix)) {
                return getTokenProgramInstructionName(ix, tx);
            }
            return undefined;
        })
        .filter(type => type !== undefined);

    return (
        <>
            <p className="m-0 p-0">
                {instructionTypes.length > 0 && (
                    <span
                        onClick={e => {
                            e.preventDefault();
                            setExpanded(!expanded);
                        }}
                        className="mr-1.5 cursor-pointer"
                    >
                        {expanded ? (
                            <MinusSquare className="align-[-0.1em]" size={13} />
                        ) : (
                            <PlusSquare className="align-[-0.1em]" size={13} />
                        )}
                    </span>
                )}
                {instructionType.name}
            </p>
            {expanded && (
                <ul className="m-0 list-none p-0">
                    {instructionTypes.map((type, index) => {
                        return (
                            <li key={index} className={treeItemClass}>
                                {type}
                            </li>
                        );
                    })}
                </ul>
            )}
        </>
    );
}
