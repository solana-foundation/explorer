import { InstructionDetailsProps } from '@features/transaction';
import { AddressLookupTableProgram } from '@solana/web3.js';

import { Address } from '@/app/components/common/Address';
import { Slot } from '@/app/components/common/Slot';
import { InstructionCard } from '@/app/components/instruction/InstructionCard';

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
            <tr>
                <td>Program</td>
                <td className="e-text-right">
                    <Address pubkey={AddressLookupTableProgram.programId} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Lookup Table</td>
                <td className="e-text-right">
                    <Address pubkey={info.lookupTableAccount} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Lookup Table Authority</td>
                <td className="e-text-right">
                    <Address pubkey={info.lookupTableAuthority} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Payer Account</td>
                <td className="e-text-right">
                    <Address pubkey={info.payerAccount} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Recent Slot</td>
                <td className="e-text-right">
                    <Slot slot={info.recentSlot} link />
                </td>
            </tr>
            <tr>
                <td>Bump Seed</td>
                <td className="e-text-right">{info.bumpSeed}</td>
            </tr>
        </InstructionCard>
    );
}
