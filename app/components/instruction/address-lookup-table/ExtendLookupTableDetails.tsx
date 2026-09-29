import { address, custom, defineInstructionCard, InstructionAddress } from '@entities/instruction-card';
import type { PublicKey } from '@solana/web3.js';

import { toKitAddress } from '@/app/shared/lib/web3js-compat';
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

function NewAddresses({ addresses }: { addresses: PublicKey[] }) {
    return (
        // The card table's edge padding reaches these nested cells and insets every
        // entry from the rows above; only `tbody tr td` outweighs that selector.
        <BaseTable className="[&_tbody_tr_td:first-child]:pl-0 [&_tbody_tr_td:last-child]:pr-0">
            <BaseTable.Body>
                {/* Keyed by position: an extend may list the same address twice, and the list never reorders. */}
                {addresses.map((pubkey, index) => (
                    <BaseTable.Row key={index}>
                        <BaseTable.Cell className="w-px font-mono">{index}</BaseTable.Cell>
                        <BaseTable.Cell className="text-right">
                            <InstructionAddress address={toKitAddress(pubkey)} />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </BaseTable.Body>
        </BaseTable>
    );
}
