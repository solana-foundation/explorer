import { InstructionDetailsProps } from '@features/transaction';
import { AddressLookupTableProgram } from '@solana/web3.js';

import { Address } from '@/app/components/common/Address';
import { Slot } from '@/app/components/common/Slot';
import { InstructionCard } from '@/app/components/instruction/InstructionCard';
import { BaseTable } from '@/app/shared/ui/Table';

import { CreateLookupTableInfo } from './types';

export function CreateLookupTableDetailsCard(props: InstructionDetailsProps & { info: CreateLookupTableInfo }) {
    const { ix, index, result, innerCards, childIndex, info } = props;
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Address Lookup Table: Create Lookup Table"
            innerCards={innerCards}
            childIndex={childIndex}
        >
            <BaseTable.Row>
                <BaseTable.Cell>Program</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={AddressLookupTableProgram.programId} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Lookup Table</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.lookupTableAccount} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Lookup Table Authority</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.lookupTableAuthority} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Payer Account</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Address pubkey={info.payerAccount} alignRight link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Recent Slot</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">
                    <Slot slot={info.recentSlot} link />
                </BaseTable.Cell>
            </BaseTable.Row>
            <BaseTable.Row>
                <BaseTable.Cell>Bump Seed</BaseTable.Cell>
                <BaseTable.Cell className="e-text-right">{info.bumpSeed}</BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
