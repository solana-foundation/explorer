import { AddressLookupTableProgram } from '@solana/web3.js';

import { Address } from '@/app/components/common/Address';
import { InstructionCard } from '@/app/components/instruction/InstructionCard';
import { InstructionDetailsProps } from '@/app/components/transaction/InstructionsSection';
import { BaseTable } from '@/app/shared/ui/Table';

import { CloseLookupTableInfo } from './types';

export function CloseLookupTableDetailsCard(props: InstructionDetailsProps & { info: CloseLookupTableInfo }) {
    const { ix, index, result, innerCards, childIndex, info } = props;
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Address Lookup Table: Close Lookup Table"
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
        </InstructionCard>
    );
}
