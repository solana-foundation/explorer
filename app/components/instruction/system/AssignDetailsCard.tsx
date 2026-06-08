import { Address } from '@components/common/Address';
import { ParsedInstruction, SignatureResult, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { AssignInfo } from './types';

export function AssignDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: AssignInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="System Program: Assign Account"
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
                <BaseTable.Cell>Account Address</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.account} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Assigned Program Id</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.owner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
