import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { SolBalance } from '@components/common/SolBalance';
import { ParsedInstruction, SignatureResult, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { TransferWithSeedInfo } from './types';

export function TransferWithSeedDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: TransferWithSeedInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="System Program: Transfer w/ Seed"
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
                <BaseTable.Cell>Destination Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.destination} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Base Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.sourceBase} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Transfer Amount (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <SolBalance lamports={info.lamports} />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Seed</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Copyable text={info.sourceSeed}>
                        <code>{info.sourceSeed}</code>
                    </Copyable>
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Source Owner</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.sourceOwner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
