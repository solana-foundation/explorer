import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { ParsedInstruction, SignatureResult, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

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
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={SystemProgram.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>From Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.source} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>New Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.newAccount} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Transfer Amount (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <SolBalance lamports={info.lamports} />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Allocated Data Size</BaseTable.Cell>
                <BaseTable.Cell className="text-right">{info.space} byte(s)</BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Assigned Program Id</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.owner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
