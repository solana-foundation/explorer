import { AddressLookupTableProgram } from '@solana/web3.js';
import { InstructionDetailsProps } from '../../transaction/InstructionsSection';
import { InstructionCard } from '../InstructionCard';
import { CloseLookupTableInfo } from './types';
import { Address } from '../../common/Address';

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
            <tr>
                <td>Program</td>
                <td className="text-lg-end">
                    <Address pubkey={AddressLookupTableProgram.programId} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Lookup Table</td>
                <td className="text-lg-end">
                    <Address pubkey={info.lookupTableAccount} alignRight link />
                </td>
            </tr>
            <tr>
                <td>Lookup Table Authority</td>
                <td className="text-lg-end">
                    <Address pubkey={info.lookupTableAuthority} alignRight link />
                </td>
            </tr>
        </InstructionCard>
    );
}
