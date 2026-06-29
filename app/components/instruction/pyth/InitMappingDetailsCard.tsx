import { Address } from '@components/common/Address';
import { SignatureResult, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { InitMappingParams } from './program';

export default function InitMappingDetailsCard({
    ix,
    index,
    result,
    info,
    innerCards,
    childIndex,
}: {
    ix: TransactionInstruction;
    index: number;
    result: SignatureResult;
    info: InitMappingParams;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Pyth: Init Mapping Account"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={ix.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Funding Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.fundingPubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Mapping Account</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.mappingPubkey} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
