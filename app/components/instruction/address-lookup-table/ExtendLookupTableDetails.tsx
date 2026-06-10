import { InstructionDetailsProps } from '@features/transaction';
import { AddressLookupTableProgram, PublicKey } from '@solana/web3.js';

import { Address } from '@/app/components/common/Address';
import { InstructionCard } from '@/app/components/instruction/InstructionCard';
import { BaseTable } from '@/app/shared/ui/Table';

import { ExtendLookupTableInfo } from './types';

export function ExtendLookupTableDetailsCard(props: InstructionDetailsProps & { info: ExtendLookupTableInfo }) {
    const { ix, index, result, innerCards, childIndex, info } = props;
    return (
        <InstructionCard
            ix={ix}
            index={index}
            result={result}
            title="Address Lookup Table: Extend Lookup Table"
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
                <BaseTable.Cell>New Addresses</BaseTable.Cell>
                <BaseTable.Cell style={{ paddingRight: '1rem' }}>
                    <table>
                        <BaseTable.Body>
                            {info.newAddresses.map((address, index) => (
                                <BaseTable.Row key={address.toString()}>
                                    <BaseTable.Cell className="e-font-mono e-w-px">{index}</BaseTable.Cell>
                                    <BaseTable.Cell className="e-text-right">
                                        <Address pubkey={new PublicKey(address)} alignRight link />
                                    </BaseTable.Cell>
                                </BaseTable.Row>
                            ))}
                        </BaseTable.Body>
                    </table>
                </BaseTable.Cell>
            </BaseTable.Row>
        </InstructionCard>
    );
}
