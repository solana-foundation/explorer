import { Address } from '@components/common/Address';
import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseRawDetails } from '../../BaseRawDetails';

export function BaseCreateDetailsCard({
    ix,
    index,
    raw,
    result,
    innerCards,
    childIndex,
    children,
    InstructionCardComponent = BaseInstructionCard,
}: {
    ix: ParsedInstruction;
    index: number;
    raw: TransactionInstruction;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
    children?: React.ReactNode;
    InstructionCardComponent?: React.FC<Parameters<typeof BaseInstructionCard>[0]>;
}) {
    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            raw={raw}
            result={result}
            title="Associated Token Program: Create"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <tr>
                <td>Program</td>
                <td className="text-lg-end">
                    <Address pubkey={ix.programId} alignRight link />
                </td>
            </tr>
            {children ? children : <BaseRawDetails ix={raw} />}
        </InstructionCardComponent>
    );
}
