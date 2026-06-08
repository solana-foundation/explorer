import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { ParsedInstruction, SignatureResult, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { TransferInfo } from './types';

export function TransferDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: TransferInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="System Program: Transfer"
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
                <BaseTable.Cell>From Address</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.source} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>To Address</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.destination} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Transfer Amount (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <SolBalance lamports={info.lamports} />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
