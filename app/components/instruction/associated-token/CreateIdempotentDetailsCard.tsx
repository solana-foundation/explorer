import { Address } from '@components/common/Address';
import { ProgramField } from '@entities/instruction-card';
import { ParsedInstruction, SignatureResult } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { CreateIdempotentInfo } from './types';

export function CreateIdempotentDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: CreateIdempotentInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
}) {
    const { ix, index, result, info, innerCards, childIndex, InstructionCardComponent = InstructionCard } = props;

    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            result={result}
            title="Associated Token Program: Create Idempotent"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <ProgramField programId={ix.programId} />
            <BaseTable.Row>
                <BaseTable.Cell>Source</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.source} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.account} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Wallet</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.wallet} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Mint</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.mint} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>System Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.systemProgram} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Token Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.tokenProgram} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCardComponent>
    );
}
