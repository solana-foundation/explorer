import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { ParsedInstruction, SignatureResult, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { InstructionCard } from '../InstructionCard';
import { CreateAccountInfo } from './types';

export function CreateDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: CreateAccountInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="System Program: Create Account"
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
                <td>From Address</td>
                <td className="e-text-right">
                    <Address pubkey={info.source} alignRight link />
                </td>
            </tr>

            <tr>
                <td>New Address</td>
                <td className="e-text-right">
                    <Address pubkey={info.newAccount} alignRight link />
                </td>
            </tr>

            <tr>
                <td>Transfer Amount (SOL)</td>
                <td className="e-text-right">
                    <SolBalance lamports={info.lamports} />
                </td>
            </tr>

            <tr>
                <td>Allocated Data Size</td>
                <td className="e-text-right">{info.space} byte(s)</td>
            </tr>

            <tr>
                <td>Assigned Program Id</td>
                <td className="e-text-right">
                    <Address pubkey={info.owner} alignRight link />
                </td>
            </tr>
        </InstructionCard>
    );
}
