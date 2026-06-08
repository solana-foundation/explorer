import { AddressLookupTableProgram, ParsedInstruction, ParsedTransaction, SignatureResult } from '@solana/web3.js';

import { Address } from '@/app/components/common/Address';
import { InstructionCard } from '@/app/components/instruction/InstructionCard';
import { BaseTable } from '@/app/shared/ui/Table';

import { FreezeLookupTableInfo } from './types';

type DetailsProps = {
    ix: ParsedInstruction;
    index: number;
    result: SignatureResult;
    tx: ParsedTransaction;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function FreezeLookupTableDetailsCard(props: DetailsProps & { info: FreezeLookupTableInfo }) {
    const { ix, index, result, innerCards, childIndex, info } = props;
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Address Lookup Table: Freeze Lookup Table"
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
