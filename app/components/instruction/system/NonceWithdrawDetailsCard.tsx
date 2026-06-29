import { Address } from '@components/common/Address';
import { SolBalance } from '@components/common/SolBalance';
import { ParsedInstruction, SignatureResult, SystemProgram } from '@solana/web3.js';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { InstructionCard } from '../InstructionCard';
import { WithdrawNonceInfo } from './types';

export function NonceWithdrawDetailsCard(props: {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    info: WithdrawNonceInfo;
    innerCards?: JSX.Element[];
    childIndex?: number;
}) {
    const { ix, index, result, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="System Program: Withdraw Nonce"
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
                <BaseTable.Cell>Nonce Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.nonceAccount} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Authority Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.nonceAuthority} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>To Address</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.destination} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Withdraw Amount (SOL)</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <SolBalance lamports={info.lamports} />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
