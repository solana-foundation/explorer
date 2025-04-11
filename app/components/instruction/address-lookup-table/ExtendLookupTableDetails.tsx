import { AddressLookupTableProgram, PublicKey } from '@solana/web3.js';

import { Address } from '@/app/components/common/Address';
import { InstructionCard } from '@/app/components/instruction/InstructionCard';
import { InstructionDetailsProps } from '@/app/components/transaction/InstructionsSection';

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
            <tr>
                <td>New Addresses</td>
                <td style={{ paddingRight: '1rem' }}>
                    <table>
                        <tbody>
                            {info.newAddresses.map((address, index) => (
                                <tr key={address.toString()}>
                                    <td className="w-1 font-monospace">{index}</td>
                                    <td className="text-lg-end">
                                        <Address pubkey={new PublicKey(address)} alignRight link />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </td>
            </tr>
        </InstructionCard>
    );
}
