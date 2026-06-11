import { Address } from '@components/common/Address';
import { ProgramField } from '@entities/instruction-card';
import { ParsedInstruction, PublicKey, SignatureResult } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';

export function CreateDetailsCard({
    ix,
    index,
    result,
    innerCards,
    childIndex,
    InstructionCardComponent = InstructionCard,
}: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    innerCards?: JSX.Element[];
    childIndex?: number;
    InstructionCardComponent?: React.FC<Parameters<typeof InstructionCard>[0]>;
}) {
    const info = ix.parsed.info;
    return (
        <InstructionCardComponent
            ix={ix}
            index={index}
            result={result}
            title="Associated Token Program: Create"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <ProgramField programId={ix.programId} />

            <BaseTable.Row>
                <BaseTable.Cell>Source</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(info.source)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Account</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(info.account)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Mint</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(info.mint)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Wallet</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(info.wallet)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>System Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(info.systemProgram)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Token Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={new PublicKey(info.tokenProgram)} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCardComponent>
    );
}
