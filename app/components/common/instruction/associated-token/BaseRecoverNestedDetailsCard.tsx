import { BaseInstructionCard } from '@components/common/BaseInstructionCard';
import { ParsedInstruction, SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseRawDetails } from '../../BaseRawDetails';
import { RecoverNestedInfo } from './types';

export function BaseRecoverNestedDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    raw: TransactionInstruction;
    result: SignatureResult;
    info?: RecoverNestedInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
    children?: React.ReactNode;
    InstructionCardComponent?: React.FC<Parameters<typeof BaseInstructionCard>[0]>;
}) {
    const {
        ix,
        index,
        raw,
        result,
        children,
        innerCards,
        childIndex,
        InstructionCardComponent = BaseInstructionCard,
    } = props;

    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            raw={raw}
            result={result}
            title="Associated Token Program: Recover Nested"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            {children ? children : <BaseRawDetails ix={raw} />}
        </InstructionCardComponent>
    );
}
