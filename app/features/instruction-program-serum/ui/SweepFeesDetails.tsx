import { Address } from '@components/common/Address';
import { InstructionCard } from '@components/instruction/InstructionCard';
import { getSerumInstructionLabel, SweepFees } from '@explorer/decoder-serum';
import React from 'react';

import { BaseTable } from '@/app/shared/ui/Table';

import { SerumIxDetailsProps } from './types';

export function SweepFeesDetailsCard(props: SerumIxDetailsProps<SweepFees>) {
    const { ix, index, result, programName, info, innerCards, childIndex } = props;

    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title={`${programName} Program: ${getSerumInstructionLabel(ix)}`}
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Market</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.market} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Quote Vault</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.quoteVault} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Fee Sweeping Authority</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.feeSweepingAuthority} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Fee Receiver</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.quoteFeeReceiver} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>

            <BaseTable.Row>
                <BaseTable.Cell>Vault Signer</BaseTable.Cell>
                <BaseTable.Cell className="text-right">
                    <Address pubkey={info.accounts.vaultSigner} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
