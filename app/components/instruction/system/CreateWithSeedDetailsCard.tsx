import { Address } from '@components/common/Address';
import { Copyable } from '@components/common/Copyable';
import { SolBalance } from '@components/common/SolBalance';
import { ParsedInstruction, SignatureResult, SystemProgram, TransactionInstruction } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { CreateAccountWithSeedInfo } from './types';

export function CreateWithSeedDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: CreateAccountWithSeedInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
    // Raw instruction for displaying accounts and hex data in raw mode (used by inspector)
    raw?: TransactionInstruction;
}) {
    const { ix, index, result, info, innerCards, childIndex, raw } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="System Program: Create Account w/ Seed"
            innerCards={innerCards}
            childIndex={childIndex}
            raw={raw}
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
