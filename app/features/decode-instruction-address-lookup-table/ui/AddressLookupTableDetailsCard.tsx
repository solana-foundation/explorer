import { Slot } from '@components/common/Slot';
import {
    address,
    custom,
    defineInstructionCard,
    InstructionCardView,
    type InstructionNode,
    text,
    useInstructionSurface,
} from '@entities/instruction-card';
import type { ParsedInstruction, PublicKey } from '@solana/web3.js';
import React from 'react';
import { is } from 'superstruct';

import { BaseTable } from '@/app/shared/ui/Table';

import type { AddressLookupTableParsed } from '../lib/address-lookup-table-parser';
import {
    CloseLookupTableInfo,
    CreateLookupTableInfo,
    DeactivateLookupTableInfo,
    ExtendLookupTableInfo,
    FreezeLookupTableInfo,
} from '../lib/types';

const TITLE_PREFIX = 'Address Lookup Table';

export const CreateLookupTableDetailsCard = defineInstructionCard<CreateLookupTableInfo>({
    fields: info => [
        address('Lookup Table', info.lookupTableAccount),
        address('Lookup Table Authority', info.lookupTableAuthority),
        address('Payer Account', info.payerAccount),
        custom('Recent Slot', <Slot slot={info.recentSlot} link />),
        text('Bump Seed', info.bumpSeed),
    ],
    title: `${TITLE_PREFIX}: Create Lookup Table`,
});

export const ExtendLookupTableDetailsCard = defineInstructionCard<ExtendLookupTableInfo>({
    fields: info => [
        address('Lookup Table', info.lookupTableAccount),
        address('Lookup Table Authority', info.lookupTableAuthority),
        custom('New Addresses', <NewAddresses addresses={info.newAddresses} />),
    ],
    title: `${TITLE_PREFIX}: Extend Lookup Table`,
});

export const FreezeLookupTableDetailsCard = defineInstructionCard<FreezeLookupTableInfo>({
    fields: tableFields,
    title: `${TITLE_PREFIX}: Freeze Lookup Table`,
});

export const DeactivateLookupTableDetailsCard = defineInstructionCard<DeactivateLookupTableInfo>({
    fields: tableFields,
    title: `${TITLE_PREFIX}: Deactivate Lookup Table`,
});

export const CloseLookupTableDetailsCard = defineInstructionCard<CloseLookupTableInfo>({
    fields: tableFields,
    title: `${TITLE_PREFIX}: Close Lookup Table`,
});

type AddressLookupTableDetailsCardProps = {
    /** Already normalised by the dispatcher — this card does not decode. */
    ix: ParsedInstruction;
    index: number;
    innerCards?: JSX.Element[];
    childIndex?: number;
};

export function AddressLookupTableDetailsCard({
    ix,
    index,
    innerCards,
    childIndex,
}: AddressLookupTableDetailsCardProps) {
    const node: InstructionNode = { childIndex, index, innerCards, ix, programId: ix.programId };

    if (!isAddressLookupTableParsed(ix.parsed)) {
        return <InstructionCardView node={node} title={`${TITLE_PREFIX} Program: Unknown Instruction`} defaultRaw />;
    }

    const parsed = ix.parsed;
    switch (parsed.type) {
        case 'createLookupTable':
            return <CreateLookupTableDetailsCard info={parsed.info} node={node} />;
        case 'extendLookupTable':
            return <ExtendLookupTableDetailsCard info={parsed.info} node={node} />;
        case 'freezeLookupTable':
            return <FreezeLookupTableDetailsCard info={parsed.info} node={node} />;
        case 'deactivateLookupTable':
            return <DeactivateLookupTableDetailsCard info={parsed.info} node={node} />;
        case 'closeLookupTable':
            return <CloseLookupTableDetailsCard info={parsed.info} node={node} />;
    }
}

/**
 * The dispatcher hands the RPC's own view back when the slice rejects a payload, and that view
 * carries the same type strings — only the slice's schemas tell a decoded envelope from a raw one.
 */
function isAddressLookupTableParsed(parsed: unknown): parsed is AddressLookupTableParsed {
    if (typeof parsed !== 'object' || parsed === null || !('type' in parsed) || !('info' in parsed)) return false;
    switch (parsed.type) {
        case 'createLookupTable':
            return is(parsed.info, CreateLookupTableInfo);
        case 'extendLookupTable':
            return is(parsed.info, ExtendLookupTableInfo);
        case 'freezeLookupTable':
            return is(parsed.info, FreezeLookupTableInfo);
        case 'deactivateLookupTable':
            return is(parsed.info, DeactivateLookupTableInfo);
        case 'closeLookupTable':
            return is(parsed.info, CloseLookupTableInfo);
        default:
            return false;
    }
}

function tableFields(info: FreezeLookupTableInfo) {
    return [
        address('Lookup Table', info.lookupTableAccount),
        address('Lookup Table Authority', info.lookupTableAuthority),
    ];
}

/**
 * A whole table in one cell, which no field kind describes — so it takes the
 * `custom` door and reads the address renderer off the surface itself, the way
 * `InstructionFields` would.
 */
function NewAddresses({ addresses }: { addresses: PublicKey[] }) {
    const { Address } = useInstructionSurface();

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
                            <Address pubkey={pubkey} />
                        </BaseTable.Cell>
                    </BaseTable.Row>
                ))}
            </BaseTable.Body>
        </BaseTable>
    );
}
