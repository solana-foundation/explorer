import { Address } from '@components/common/Address';
import { ParsedInstruction, SignatureResult, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { AdvanceNonceInfo } from './types';

export function NonceAdvanceDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: AdvanceNonceInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="System Program: Advance Nonce"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={SystemProgram.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Nonce Address</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.nonceAccount} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Authority Address</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.nonceAuthority} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
