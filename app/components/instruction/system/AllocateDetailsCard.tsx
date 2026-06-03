import { Address } from '@components/common/Address';
import { ParsedInstruction, SignatureResult, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { AllocateInfo } from './types';

export function AllocateDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: AllocateInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="System Program: Allocate Account"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <tr>
                <td>Program</td>
                <td className="e-text-right">
                    <Address pubkey={SystemProgram.programId} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Account Address</td>
                <td className="e-text-right">
                    <Address pubkey={info.account} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Allocated Data Size</td>
                <td className="e-text-right">{info.space} byte(s)</td>
            </tr>
        </InstructionCard>
    );
}
