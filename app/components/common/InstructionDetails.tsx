import { isTokenProgramData } from '@providers/accounts';
import { ConfirmedSignatureInfo } from '@solana/web3.js';
import { getTokenProgramInstructionName, InstructionType } from '@utils/instruction';
import React from 'react';
import { MinusSquare, PlusSquare } from 'react-feather';

// Tree connector lines ported from dashkit `.tree`: ::before draws the elbow, the left border the spine (dropped on the last row, which corners its ::before instead); `thin` ≡ 1px, em units keep it text-relative.
const treeItemClass =
    "e-ml-[0.35em] e-border-0 e-border-l e-border-solid e-border-[#808080] last:e-border-l-0 before:e-inline-block before:e-h-[0.6em] before:e-w-[1.4em] before:e-mr-[0.1em] before:e-align-top before:e-border-0 before:e-border-b before:e-border-solid before:e-border-[#808080] before:e-content-[''] last:before:e-border-l";

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
            <p className="e-m-0 e-p-0">
                {instructionTypes.length > 0 && (
                    <span
                        onClick={e => {
                            e.preventDefault();
                            setExpanded(!expanded);
                        }}
                        className="e-mr-1.5 e-cursor-pointer"
                    >
                        {expanded ? (
                            <MinusSquare className="e-align-text-top" size={13} />
                        ) : (
                            <PlusSquare className="e-align-text-top" size={13} />
                        )}
                    </span>
                )}
                {instructionType.name}
            </p>
            {expanded && (
                <ul className="e-m-0 e-list-none e-p-0">
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
