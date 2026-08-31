import { address, custom, defineInstructionCard, useInstructionSurface } from '@entities/instruction-card';
import type { PublicKey } from '@solana/web3.js';

import { BaseTable } from '@/app/shared/ui/Table';

import { ExtendLookupTableInfo } from './types';

export const ExtendLookupTableDetailsCard = defineInstructionCard<ExtendLookupTableInfo>({
    fields: info => [
        address('Lookup Table', info.lookupTableAccount),
        address('Lookup Table Authority', info.lookupTableAuthority),
        custom('New Addresses', <NewAddresses addresses={info.newAddresses} />),
    ],
    title: 'Address Lookup Table: Extend Lookup Table',
});

/**
 * A whole table in one cell, which no field kind describes — so it takes the
 * `custom` door and reads the address renderer off the surface itself, the way
 * `InstructionFields` would.
 */
function NewAddresses({ addresses }: { addresses: PublicKey[] }) {
    const { Address } = useInstructionSurface();

    return (
        <table>
            <BaseTable.Body>
                {/* Keyed by position: an extend may list the same address twice, and the list never reorders. */}
                {addresses.map((pubkey, index) => (
                    <BaseTable.Row key={index}>
                        <BaseTable.Cell className="w-px font-mono">{index}</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">
                            <Address pubkey={pubkey} />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </BaseTable.Body>
        </table>
    );
}
