import { Address } from '@components/common/Address';
import { ProgramField } from '@entities/instruction-card';
import { ParsedInstruction, SignatureResult } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { RecoverNestedInfo } from './types';

export function RecoverNestedDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: RecoverNestedInfo;
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
            title="Associated Token Program: Recover Nested"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <ProgramField programId={ix.programId} />
            <BaseTable.Row>
                <BaseTable.Cell>Destination</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.destination} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Nested Mint</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.nestedMint} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Nested Owner</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.nestedOwner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Nested Source</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.nestedSource} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Owner Mint</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.ownerMint} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Owner</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.wallet} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Token Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.tokenProgram} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCardComponent>
    );
}
