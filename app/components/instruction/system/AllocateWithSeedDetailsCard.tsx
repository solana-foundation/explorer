import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { ParsedInstruction, SignatureResult, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { AllocateWithSeedInfo } from './types';

export function AllocateWithSeedDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: AllocateWithSeedInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="System Program: Allocate Account w/ Seed"
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
                <BaseTable.Cell>Account Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.account} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Base Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.base} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Seed</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Copyable text={info.seed}>
                        <code>{info.seed}</code>
                    </Copyable>
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
